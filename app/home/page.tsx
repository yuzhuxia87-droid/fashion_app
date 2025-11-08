import { getWeatherByLocation } from '@/lib/weather/api';
import HomeClient from './HomeClient';
import { WeatherData } from '@/types';
import { RecommendationsResponseSchema } from '@/lib/validators/api';
import { requireAuth } from '@/lib/auth/server';
import { fetchApiSafe, buildQueryString } from '@/lib/api/fetcher';

async function getInitialData() {
  // Single line authentication
  await requireAuth();

  // Get weather data (default to Tokyo)
  // Note: Geolocation can only be accessed in browser, so we use default location
  let weather: WeatherData | null = null;
  try {
    weather = await getWeatherByLocation(35.689, 139.692); // Tokyo
  } catch (error) {
    console.error('Weather fetch error:', error);
  }

  // Build query params
  const queryString = buildQueryString({
    excludeWornRecently: true,
    matchWeather: weather ? true : false,
    count: 4,
    weather: weather ? JSON.stringify(weather) : undefined,
  });

  // Fetch recommendations with type safety
  const { data } = await fetchApiSafe(
    `/api/recommendations${queryString}`,
    RecommendationsResponseSchema
  );

  return {
    weather,
    recommendations: data?.recommendations || [],
  };
}

export default async function HomePage() {
  const initialData = await getInitialData();

  return <HomeClient initialData={initialData} />;
}
