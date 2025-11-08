import { createClient } from '@/lib/supabase/server';
import {
  OutfitWithDetails,
  WeatherData,
  RecommendationFilters,
} from '@/types';

export async function getRecommendedOutfits(
  userId: string,
  filters: RecommendationFilters = {},
  weather?: WeatherData,
  count: number = 3
): Promise<OutfitWithDetails[]> {
  const supabase = await createClient();

  try {
    // Build query
    let query = supabase
      .from('outfits')
      .select(
        `
        *,
        clothing_items (*),
        wear_history (worn_date)
      `
      )
      .eq('user_id', userId)
      .eq('is_archived', false);

    // Apply filters
    if (filters.favoriteOnly) {
      query = query.eq('is_favorite', true);
    }

    // Execute query
    const { data: outfits, error } = await query;

    if (error) {
      console.error('Error fetching outfits:', error);
      return [];
    }

    if (!outfits || outfits.length === 0) {
      return [];
    }

    // Transform and filter outfits
    let candidates: OutfitWithDetails[] = outfits.map((outfit) => ({
      ...outfit,
      items: outfit.clothing_items || [],
      last_worn: getLastWornDate(outfit.wear_history),
    }));

    // Exclude recently worn outfits (last 2 days)
    if (filters.excludeWornRecently) {
      candidates = filterRecentlyWorn(candidates);
    }

    // Match weather conditions
    if (filters.matchWeather && weather) {
      candidates = filterByWeather(candidates, weather);
    }

    // Shuffle and return top N
    return shuffleArray(candidates).slice(0, count);
  } catch (error) {
    console.error('Error in recommendation engine:', error);
    return [];
  }
}

function getLastWornDate(
  wearHistory: Array<{ worn_date: string }> | null
): string | undefined {
  if (!wearHistory || wearHistory.length === 0) {
    return undefined;
  }

  const dates = wearHistory.map((h) => new Date(h.worn_date));
  const mostRecent = new Date(Math.max(...dates.map((d) => d.getTime())));

  return mostRecent.toISOString().split('T')[0];
}

function filterRecentlyWorn(
  outfits: OutfitWithDetails[]
): OutfitWithDetails[] {
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  return outfits.filter((outfit) => {
    if (!outfit.last_worn) {
      return true; // Never worn, include it
    }

    const lastWornDate = new Date(outfit.last_worn);
    return lastWornDate < twoDaysAgo;
  });
}

function filterByWeather(
  outfits: OutfitWithDetails[],
  weather: WeatherData
): OutfitWithDetails[] {
  const temp = weather.temperature;

  return outfits.filter((outfit) => {
    const hasOuter = outfit.items.some((item) => item.category === 'outer');

    // Cold weather (< 15°C): prefer outfits with outer layers
    if (temp < 15) {
      return hasOuter;
    }

    // Hot weather (> 25°C): prefer outfits without heavy outer layers
    if (temp > 25) {
      return !hasOuter;
    }

    // Mild weather: all outfits are okay
    return true;
  });
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function markOutfitAsWorn(
  outfitId: string,
  userId: string,
  date: Date = new Date()
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from('wear_history').insert({
      outfit_id: outfitId,
      user_id: userId,
      worn_date: date.toISOString().split('T')[0],
    });

    if (error) {
      console.error('Error marking outfit as worn:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markOutfitAsWorn:', error);
    return false;
  }
}

export async function toggleFavorite(
  outfitId: string,
  isFavorite: boolean
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('outfits')
      .update({ is_favorite: isFavorite })
      .eq('id', outfitId);

    if (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in toggleFavorite:', error);
    return false;
  }
}

export async function toggleArchive(
  outfitId: string,
  isArchived: boolean
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('outfits')
      .update({ is_archived: isArchived })
      .eq('id', outfitId);

    if (error) {
      console.error('Error toggling archive:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in toggleArchive:', error);
    return false;
  }
}
