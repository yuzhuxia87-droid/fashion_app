import HomeClient from './HomeClient';
import { requireAuth } from '@/lib/auth/server';
import { getRecommendedOutfits } from '@/lib/recommendations/engine';
import { getWeatherByLocation } from '@/lib/weather/api';

async function getHomeData() {
  // Authenticate user
  const { user, supabase } = await requireAuth();

  // Get weather data (default to Tokyo)
  let weather = null;
  try {
    weather = await getWeatherByLocation(35.689, 139.692); // Tokyo
  } catch (error) {
    console.error('Weather fetch error:', error);
  }

  // Get recommendations
  const recommendations = await getRecommendedOutfits(
    user.id,
    {
      excludeWornRecently: true,
      matchWeather: !!weather,
    },
    weather || undefined,
    4
  );

  return {
    weather,
    recommendations,
  };
}

export default async function HomePage() {
  const data = await getHomeData();

  return <HomeClient initialData={data} />;
}
