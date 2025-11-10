'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ThumbsUp, Search } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

import { WeatherData } from '@/types';
import { OutfitWithStats } from '@/types/api';

interface HomeClientProps {
  initialData: {
    weather: WeatherData | null;
    recommendations: OutfitWithStats[];
  };
}

export default function HomeClient({ initialData }: HomeClientProps) {
  const router = useRouter();
  const [weather] = useState<WeatherData | null>(initialData.weather);
  const [recommendedOutfit, setRecommendedOutfit] = useState<OutfitWithStats | null>(
    initialData.recommendations[0] || null
  );
  const [alternativeOutfits, setAlternativeOutfits] = useState<OutfitWithStats[]>(
    initialData.recommendations.slice(1, 4)
  );
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const alternativesRef = useRef<HTMLDivElement>(null);


  // Auto-scroll when alternatives are shown (mobile-optimized)
  useEffect(() => {
    if (showAlternatives && alternativesRef.current) {
      // モバイル対応：複数のrequestAnimationFrameでレンダリング完了を確実に待つ
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (alternativesRef.current) {
              const element = alternativesRef.current;
              const rect = element.getBoundingClientRect();
              const headerHeight = 100; // PageHeaderの高さ + マージン

              const scrollTarget = window.scrollY + rect.top - headerHeight;

              // window.scrollToを使用（モバイルでより確実）
              window.scrollTo({
                top: scrollTarget,
                behavior: 'smooth'
              });
            }
          });
        });
      });
    }
  }, [showAlternatives]);

  const handleDecide = async () => {
    if (!recommendedOutfit) return;

    try {
      const response = await fetch('/api/wear-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit_id: recommendedOutfit.id,
          worn_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record wear history');
      }

      toast.success('今日のコーデに決定しました！', {
        icon: <ThumbsUp className="w-4 h-4" />,
      });
    } catch (error) {
      console.error('Record wear error:', error);
      toast.error('記録に失敗しました');
    }
  };

  const handleLoadMore = async () => {
    if (!weather) return;

    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        excludeWornRecently: 'true',
        matchWeather: 'true',
        count: '3',
        weather: JSON.stringify(weather),
      });

      const response = await fetch(`/api/recommendations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch more recommendations');
      }

      const data = await response.json();
      const newRecommendations: OutfitWithStats[] = data.recommendations || [];
      setAlternativeOutfits((prev) => [...prev, ...newRecommendations]);
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('追加の提案の取得に失敗しました');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200/75 via-pink-200/60 to-purple-100/70">
      <PageHeader
        title="今日のコーデ"
        subtitle={
          weather
            ? `${new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })} · ${Math.round(weather.temperature)}°C ${weather.description}`
            : new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
        }
        showLogout
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-8 space-y-6 md:space-y-8">

        {/* Recommended Outfit */}
        {recommendedOutfit ? (
          <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0">
            <CardHeader className="p-5 md:p-6">
              <CardTitle className="text-lg md:text-xl">今日のおすすめコーデ</CardTitle>
              <CardDescription className="text-sm md:text-base">
                あなたにぴったりのコーディネートを提案します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-5 p-5 md:p-6 pt-0">
              <div className="relative aspect-[3/4] md:aspect-[4/5] lg:aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100/30">
                <Image
                  src={recommendedOutfit.image_url}
                  alt="Recommended outfit"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button className="flex-1" onClick={handleDecide}>
                  <ThumbsUp className="mr-2" />
                  これで決定！
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAlternatives(!showAlternatives)}
                >
                  <RefreshCw className="mr-2" />
                  他の提案を見る
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={Search}
            title="おすすめコーデがありません"
            description="新しいコーディネートを追加してください"
            action={{
              label: 'コーデを探す',
              onClick: () => router.push('/browse'),
            }}
          />
        )}

        {/* Alternative Outfits */}
        {showAlternatives && alternativeOutfits.length > 0 && (
          <div ref={alternativesRef}>
            <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0">
              <CardHeader className="p-5 md:p-6">
                <CardTitle className="text-lg md:text-xl">その他の提案</CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-6 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
                  {alternativeOutfits.map((outfit) => (
                    <div
                      key={outfit.id}
                      className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100/30 cursor-pointer group"
                      onClick={() => setRecommendedOutfit(outfit)}
                    >
                      <Image
                        src={outfit.image_url}
                        alt="Alternative outfit"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {alternativeOutfits.length >= 3 && (
              <Button
                variant="outline"
                className="w-full mt-6 bg-white shadow-md"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <RefreshCw className="mr-2" />
                    さらに見る
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
