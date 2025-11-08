'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  X,
  Loader2,
  Check,
  Archive as ArchiveIcon,
  Save
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

export default function BrowsePage() {
  const router = useRouter();

  // Discovery mode states
  const [images, setImages] = useState<SearchImage[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Tab states
  const [activeTab, setActiveTab] = useState<'discover' | 'generate'>('discover');

  // Search mode states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

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

  const loadDiscoverImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/discover-images?per_page=20');
      if (!response.ok) throw new Error('Failed to fetch images');

      const data = await response.json();
      setImages(data.images || []);
      setHasMore(data.hasMore !== false);
    } catch (error) {
      console.error('Error loading discover images:', error);
      toast.error('画像の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const searchImages = async (query: string) => {
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
        items: data.analysis.items.map((item: any) => ({
          ...item,
          has_item: false,
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

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
    };

    checkAuth();
    loadDiscoverImages();
  }, []);

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

  if (loading && images.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="コーデを探す" showLogout />
        <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
          <LoadingSpinner message="読み込み中..." />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="コーデを探す"
        showLogout
        action={{
          label: '検索',
          onClick: () => setSearchDialogOpen(true),
          icon: Search,
        }}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
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
          <TabsContent value="discover" className="mt-0 space-y-6">
            {/* Category Tags */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TAGS.map((tag) => (
                <Badge
                  key={tag.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-purple-50 hover:border-purple-300"
                  onClick={() => {
                    setSearchQuery(tag.query);
                    searchImages(tag.query);
                  }}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>

            {/* Image Grid */}
            {images.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <Card
                      key={image.id}
                      className="group cursor-pointer overflow-hidden"
                      onClick={() => handleAnalyzeImage(image.url)}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
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
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
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
            <Card>
              <CardContent className="p-6 space-y-4">
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
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
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

            <div className="flex flex-wrap gap-2">
              {CATEGORY_TAGS.slice(0, 6).map((tag) => (
                <Badge
                  key={tag.label}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => {
                    setSearchQuery(tag.query);
                    searchImages(tag.query);
                  }}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>

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
      <Dialog open={!!selectedImage} onOpenChange={() => {
        setSelectedImage(null);
        setAnalysisResult(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {analyzing ? 'AI解析中...' : '解析結果'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedImage && (
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={selectedImage}
                  alt="Selected outfit"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}

            {analyzing && <LoadingSpinner message="AI解析中..." />}

            {analysisResult && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => handleSaveOutfit(false)} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    コレクションに保存
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSaveOutfit(true)}
                    className="flex-1"
                  >
                    <ArchiveIcon className="w-4 h-4 mr-2" />
                    アーカイブに保存
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
