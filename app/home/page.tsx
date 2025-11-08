import { createClient } from '@/lib/supabase/server';
import { getWeatherByLocation } from '@/lib/weather/api';
import { redirect } from 'next/navigation';
import HomeClient from './HomeClient';
import { WeatherData } from '@/types';
import { OutfitWithStats } from '@/types/api';
import { RecommendationsResponseSchema } from '@/lib/validators/api';

async function getInitialData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // 天気データを取得 (デフォルトで東京)
  // Note: Geolocationはブラウザ側でしか取得できないため、デフォルト位置を使用
  let weather: WeatherData | null = null;
  try {
    weather = await getWeatherByLocation(35.689, 139.692); // 東京
  } catch (error) {
    console.error('Weather fetch error:', error);
  }

  // レコメンデーションを取得
  let recommendations: OutfitWithStats[] = [];
  try {
    const params = new URLSearchParams({
      excludeWornRecently: 'true',
      matchWeather: weather ? 'true' : 'false',
      count: '4',
    });

    if (weather) {
      params.set('weather', JSON.stringify(weather));
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/recommendations?${params}`, {
      cache: 'no-store', // 常に最新のレコメンデーションを取得
    });

    if (response.ok) {
      const json = await response.json();
      const result = RecommendationsResponseSchema.safeParse(json);

      if (result.success) {
        recommendations = result.data.recommendations;
      } else {
        console.error('Invalid API response schema:', result.error);
      }
    }
  } catch (error) {
    console.error('Recommendations fetch error:', error);
  }

  return {
    weather,
    recommendations,
  };
}

export default async function HomePage() {
  const initialData = await getInitialData();

  return <HomeClient initialData={initialData} />;
}
