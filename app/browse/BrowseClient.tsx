'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Sparkles,
  Loader2,
  Check,
  Archive as ArchiveIcon,
  Save,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

import { SearchImage } from '@/types/external';
import { ClothingItemInput } from '@/types/extended';

const CATEGORY_TAGS = [
  { label: 'カジュアル', query: 'casual outfit' },
  { label: 'フォーマル', query: 'formal wear' },
  { label: 'ストリート', query: 'street style' },
  { label: '韓国風', query: 'korean fashion' },
  { label: 'デート', query: 'date night outfit' },
  { label: '春コーデ', query: 'spring outfit' },
  { label: '夏コーデ', query: 'summer outfit' },
  { label: '秋コーデ', query: 'fall outfit' },
  { label: '冬コーデ', query: 'winter outfit' },
  { label: 'オフィス', query: 'office outfit' },
  { label: 'パーティー', query: 'party dress' },
  { label: 'リゾート', query: 'resort wear' },
];

interface BrowseClientProps {
  initialImages: SearchImage[];
}

export default function BrowseClient({ initialImages }: BrowseClientProps) {
  const router = useRouter();

  // Discovery mode states
  const [images, setImages] = useState<SearchImage[]>(initialImages);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Tab states
  const [activeTab, setActiveTab] = useState<'discover' | 'generate'>('discover');

  // Search mode states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);

  // Generate tab states
  const [generateDescription, setGenerateDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Selected image & analysis states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    items: ClothingItemInput[];
    season?: string;
    style?: string;
  } | null>(null);

  // Saved images tracking
  const [savedImageIds, setSavedImageIds] = useState<Set<string>>(new Set());

  // Infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  const searchImages = async (query: string, fromTag: boolean = false) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setPage(1);
      const response = await fetch(`/api/search-images?query=${encodeURIComponent(query)}&page=1&per_page=20`);
      if (!response.ok) throw new Error('Failed to search images');

      const data = await response.json();
      setImages(data.images || []);
      setHasMore(data.hasMore !== false);
      setSearchDialogOpen(false);

      // フリーテキスト検索の場合はタグの選択状態をクリア
      if (!fromTag) {
        setActiveTag(null);
      }
    } catch (error) {
      console.error('Error searching images:', error);
      toast.error('検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreImages = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const url = searchQuery
        ? `/api/search-images?query=${encodeURIComponent(searchQuery)}&page=${nextPage}&per_page=20`
        : `/api/discover-images?page=${nextPage}&per_page=20`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load more images');

      const data = await response.json();
      setImages((prev) => [...prev, ...(data.images || [])]);
      setPage(nextPage);
      setHasMore(data.hasMore !== false);
    } catch (error) {
      console.error('Error loading more images:', error);
      toast.error('追加の画像読み込みに失敗しました');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, searchQuery]);

  const handleGenerateImage = async () => {
    if (!generateDescription.trim()) {
      toast.error('説明を入力してください');
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: generateDescription }),
      });

      if (!response.ok) throw new Error('Failed to generate image');

      const data = await response.json();
      setGeneratedImage(data.imageUrl);
      toast.success('画像を生成しました！');
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('画像生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyzeImage = async (imageUrl: string) => {
    try {
      setSelectedImage(imageUrl);
      setAnalyzing(true);
      setAnalysisResult(null);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) throw new Error('Failed to analyze image');

      const data = await response.json();
      setAnalysisResult({
        items: data.analysis.items.map((item: { item_type: string; category: string; color: string; confidence: number }) => ({
          category: item.category,
          color: item.color,
          item_type: item.item_type,
          has_item: true,
        })),
        season: data.analysis.season,
        style: data.analysis.style,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('画像解析に失敗しました');
      setSelectedImage(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveOutfit = async (toArchive: boolean = false) => {
    if (!selectedImage || !analysisResult) return;

    try {
      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedImage,
          items: analysisResult.items.filter((item) => item.has_item),
          season: analysisResult.season,
          style: analysisResult.style,
          isArchived: toArchive,
        }),
      });

      if (!response.ok) throw new Error('Failed to save outfit');

      toast.success(toArchive ? 'アーカイブに保存しました' : 'コレクションに保存しました');
      setSavedImageIds((prev) => new Set(prev).add(selectedImage));
      setSelectedImage(null);
      setAnalysisResult(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存に失敗しました');
    }
  };

  const toggleItemOwnership = (index: number) => {
    if (!analysisResult) return;

    setAnalysisResult({
      ...analysisResult,
      items: analysisResult.items.map((item, i) =>
        i === index ? { ...item, has_item: !item.has_item } : item
      ),
    });
  };

  // Infinite scroll setup
  useEffect(() => {
    if (loading || !observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreImages();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [loading, hasMore, loadingMore, loadMoreImages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200/75 via-pink-200/60 to-purple-100/70">
      <PageHeader
        title="コーデを探す"
        showLogout
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'discover' | 'generate')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="discover">
              <Search className="w-4 h-4 mr-2" />
              発見
            </TabsTrigger>
            <TabsTrigger value="generate">
              <Sparkles className="w-4 h-4 mr-2" />
              AI生成
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="mt-0 space-y-4">
            {/* Search Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSearchDialogOpen(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              キーワードで検索
            </Button>

            {/* Category Tags - Collapsible */}
            <div className="space-y-2">
              {/* Featured Tags (always visible) */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {CATEGORY_TAGS.slice(0, 3).map((tag) => (
                  <Button
                    key={tag.label}
                    variant={activeTag === tag.label ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs md:text-sm"
                    onClick={() => {
                      setActiveTag(tag.label);
                      setSearchQuery(tag.query);
                      searchImages(tag.query, true);
                    }}
                  >
                    {tag.label}
                  </Button>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs md:text-sm gap-1 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  onClick={() => setShowAllTags(!showAllTags)}
                  aria-expanded={showAllTags}
                  aria-controls="category-tags-expanded"
                  aria-label={showAllTags ? 'タグを折りたたむ' : 'すべてのタグを表示'}
                >
                  {showAllTags ? 'たたむ' : 'もっと見る'}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ease-out ${
                      showAllTags ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </div>

              {/* Expanded Tags (slide down) */}
              <div
                id="category-tags-expanded"
                className="grid transition-all duration-300 ease-out"
                style={{
                  gridTemplateRows: showAllTags ? '1fr' : '0fr',
                }}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {CATEGORY_TAGS.slice(3).map((tag, index) => (
                      <Button
                        key={tag.label}
                        variant={activeTag === tag.label ? 'default' : 'outline'}
                        size="sm"
                        className={`h-8 text-xs md:text-sm transition-all duration-300 ${
                          showAllTags
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 -translate-y-2'
                        }`}
                        style={{
                          transitionDelay: showAllTags ? `${index * 30}ms` : '0ms',
                        }}
                        onClick={() => {
                          setActiveTag(tag.label);
                          setSearchQuery(tag.query);
                          searchImages(tag.query, true);
                        }}
                      >
                        {tag.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Image Grid */}
            {images.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
                  {images.map((image) => (
                    <Card
                      key={image.id}
                      className="group cursor-pointer overflow-hidden shadow-md hover:shadow-xl hover:shadow-pink-100/30 transition-all duration-300"
                      onClick={() => handleAnalyzeImage(image.url)}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100/30">
                        <Image
                          src={image.thumb}
                          alt={image.description}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        {savedImageIds.has(image.url) && (
                          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Infinite scroll trigger */}
                <div ref={observerTarget} className="h-10">
                  {loadingMore && (
                    <div className="flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-foreground" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Search}
                title="画像が見つかりません"
                description="検索条件を変更してみてください"
              />
            )}
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate" className="mt-0 space-y-6">
            <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0">
              <CardContent className="p-5 space-y-3.5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">コーディネートの説明</label>
                  <Textarea
                    placeholder="例: カジュアルな夏のデート服、白いワンピースと麦わら帽子"
                    value={generateDescription}
                    onChange={(e) => setGenerateDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleGenerateImage}
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      画像を生成
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {generatedImage && (
              <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0">
                <CardContent className="p-5 space-y-3.5">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100/30">
                    <Image
                      src={generatedImage}
                      alt="Generated outfit"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAnalyzeImage(generatedImage)}
                      className="flex-1"
                    >
                      この画像を使用
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedImage(null)}
                    >
                      別の画像を生成
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>コーディネートを検索</DialogTitle>
            <DialogDescription>
              キーワードやスタイルで検索してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="例: カジュアル、デート、夏コーデ"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchImages(searchQuery)}
              autoFocus
            />

            <Button
              onClick={() => searchImages(searchQuery)}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              検索
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analysis Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedImage(null);
            setAnalysisResult(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {analyzing ? 'AI解析中...' : '解析結果'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedImage && (
                <div className="relative w-full max-w-md mx-auto aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100/30">
                <Image
                  src={selectedImage}
                  alt="Selected outfit"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-pink-400 animate-spin" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-gray-900 text-lg font-semibold">
                        AI解析中...
                      </p>
                      <p className="text-gray-600 text-sm">
                        コーディネートを分析しています
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                {/* Season and Style */}
                {(analysisResult.season || analysisResult.style) && (
                  <div className="flex gap-2">
                    {analysisResult.season && (
                      <Badge variant="outline">{analysisResult.season}</Badge>
                    )}
                    {analysisResult.style && (
                      <Badge variant="outline">{analysisResult.style}</Badge>
                    )}
                  </div>
                )}

                {/* Detected Items */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-800">検出されたアイテム</p>
                  <div className="grid grid-cols-1 gap-3">
                    {analysisResult.items.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                          item.has_item
                            ? 'bg-pink-50/50 shadow-md shadow-pink-400/20'
                            : 'bg-white shadow-sm hover:shadow-md'
                        }`}
                        onClick={() => toggleItemOwnership(index)}
                      >
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-200 shrink-0 ${
                            item.has_item
                              ? 'bg-pink-400'
                              : 'bg-white border-2 border-gray-300'
                          }`}
                        >
                          {item.has_item && (
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-900">
                            {item.item_type}
                          </p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-600">
                              {item.category}
                            </span>
                            {item.color && (
                              <span className="text-xs text-gray-600">
                                • {item.color}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => handleSaveOutfit(false)}
                    className="flex-1 w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    <span className="truncate">コレクションに保存</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSaveOutfit(true)}
                    className="flex-1 w-full"
                  >
                    <ArchiveIcon className="w-4 h-4 mr-2" />
                    <span className="truncate">アーカイブに保存</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
