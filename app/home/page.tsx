'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getWeatherByLocation } from '@/lib/weather/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ThumbsUp, Search } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import WeatherDisplay from '@/components/WeatherDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

import { WeatherData } from '@/types';
import { OutfitWithStats } from '@/types/api';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recommendedOutfit, setRecommendedOutfit] = useState<OutfitWithStats | null>(null);
  const [alternativeOutfits, setAlternativeOutfits] = useState<OutfitWithStats[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get weather data
      await loadWeather();

      // Get recommendations
      await loadRecommendations();
    } catch (error) {
      console.error('Load data error:', error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadWeather = async (): Promise<WeatherData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const weatherData = await getWeatherByLocation(
              position.coords.latitude,
              position.coords.longitude
            );
            setWeather(weatherData);
            resolve(weatherData);
          } catch (error) {
            console.error('Weather error:', error);
            resolve(null);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        }
      );
    });
  };

  const loadRecommendations = async (weatherData?: WeatherData | null) => {
    try {
      const params = new URLSearchParams({
        excludeWornRecently: 'true',
        matchWeather: weatherData ? 'true' : 'false',
        count: '4',
      });

      if (weatherData) {
        params.set('weather', JSON.stringify(weatherData));
      }

      const response = await fetch(`/api/recommendations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      const recommendations: OutfitWithStats[] = data.recommendations || [];

      if (recommendations.length > 0) {
        setRecommendedOutfit(recommendations[0]);
        setAlternativeOutfits(recommendations.slice(1, 4));
      } else {
        setRecommendedOutfit(null);
        setAlternativeOutfits([]);
      }
    } catch (error) {
      console.error('Recommendations error:', error);
      toast.error('おすすめの取得に失敗しました');
    }
  };

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

  const handleRefresh = async () => {
    setLoadingMore(true);
    await loadRecommendations(weather);
    setLoadingMore(false);
    toast.success('新しい提案を読み込みました');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="今日のコーデ" showLogout />
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
        title="今日のコーデ"
        subtitle={new Date().toLocaleDateString('ja-JP', {
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        })}
        showLogout
        action={{
          label: 'コーデを探す',
          onClick: () => router.push('/browse'),
          icon: Search,
        }}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-20 space-y-6">
        {/* Weather Section */}
        {weather && <WeatherDisplay weather={weather} />}

        {/* Recommended Outfit */}
        {recommendedOutfit ? (
          <Card>
            <CardHeader>
              <CardTitle>今日のおすすめコーデ</CardTitle>
              <CardDescription>
                あなたにぴったりのコーディネートを提案します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={recommendedOutfit.image_url}
                  alt="Recommended outfit"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleDecide}>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  これで決定！
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAlternatives(!showAlternatives)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
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
          <Card>
            <CardHeader>
              <CardTitle>その他の提案</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {alternativeOutfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 cursor-pointer group"
                    onClick={() => setRecommendedOutfit(outfit)}
                  >
                    <Image
                      src={outfit.image_url}
                      alt="Alternative outfit"
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>

              {alternativeOutfits.length >= 3 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      さらに見る
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
