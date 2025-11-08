import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRecommendedOutfits } from '@/lib/recommendations/engine';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const excludeWornRecently = searchParams.get('excludeWornRecently') === 'true';
    const matchWeather = searchParams.get('matchWeather') === 'true';
    const favoriteOnly = searchParams.get('favoriteOnly') === 'true';
    const count = parseInt(searchParams.get('count') || '4');

    // Parse weather data if provided
    let weather;
    const weatherParam = searchParams.get('weather');
    if (weatherParam) {
      try {
        weather = JSON.parse(weatherParam);
      } catch (e) {
        console.error('Failed to parse weather data:', e);
      }
    }

    // Get recommendations
    const recommendations = await getRecommendedOutfits(
      user.id,
      {
        excludeWornRecently,
        matchWeather,
        favoriteOnly,
      },
      weather,
      count
    );

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
