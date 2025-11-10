/**
 * Shared data fetching utilities for outfits
 * Eliminates code duplication across collection and archive pages
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { OutfitWithStats } from '@/types/api';
import { OutfitWithStatsSchema } from '@/lib/validators/api';

interface FetchOutfitsWithStatsOptions {
  supabase: SupabaseClient;
  userId: string;
  isArchived: boolean;
}

/**
 * Fetches outfits with wear statistics
 * Used by both collection and archive pages
 */
export async function fetchOutfitsWithStats({
  supabase,
  userId,
  isArchived,
}: FetchOutfitsWithStatsOptions): Promise<OutfitWithStats[]> {
  // Get outfits with clothing items
  const { data: outfits, error } = await supabase
    .from('outfits')
    .select(
      `
      *,
      clothing_items (*)
    `
    )
    .eq('user_id', userId)
    .eq('is_archived', isArchived)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchOutfitsWithStats] Error fetching outfits:', error);
    return [];
  }

  if (!outfits || outfits.length === 0) {
    return [];
  }

  // Get wear history for all outfits
  const outfitIds = outfits.map((o) => o.id);
  const { data: wearHistory } = await supabase
    .from('wear_history')
    .select('outfit_id, worn_date')
    .in('outfit_id', outfitIds)
    .order('worn_date', { ascending: false });

  // Aggregate wear stats
  const wearStats = (wearHistory || []).reduce(
    (
      acc: Record<string, { count: number; lastWorn: string | null }>,
      record: { outfit_id: string; worn_date: string }
    ) => {
      if (!acc[record.outfit_id]) {
        acc[record.outfit_id] = {
          count: 0,
          lastWorn: null,
        };
      }
      acc[record.outfit_id].count++;
      const currentLastWorn = acc[record.outfit_id].lastWorn;
      if (!currentLastWorn || record.worn_date > currentLastWorn) {
        acc[record.outfit_id].lastWorn = record.worn_date;
      }
      return acc;
    },
    {}
  );

  // Merge wear stats with outfits and validate
  const outfitsWithStats: OutfitWithStats[] = outfits
    .map((outfit: { id: string; clothing_items?: unknown; [key: string]: unknown }) => ({
      ...outfit,
      wear_count: wearStats[outfit.id]?.count || 0,
      last_worn: wearStats[outfit.id]?.lastWorn || null,
      items: Array.isArray(outfit.clothing_items) ? outfit.clothing_items : [],
    }))
    .map((outfit) => {
      const validated = OutfitWithStatsSchema.safeParse(outfit);
      if (!validated.success) {
        console.error('[fetchOutfitsWithStats] Validation error:', validated.error);
        return null;
      }
      return validated.data as OutfitWithStats;
    })
    .filter((outfit): outfit is NonNullable<typeof outfit> => outfit !== null) as OutfitWithStats[];

  return outfitsWithStats;
}
