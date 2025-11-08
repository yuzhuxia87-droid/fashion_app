import ArchiveClient from './ArchiveClient';
import { requireAuth } from '@/lib/auth/server';
import { OutfitWithStats } from '@/types/api';

async function getArchiveData() {
  // Authenticate user - Direct Supabase access (2025 pattern)
  const { user, supabase } = await requireAuth();

  // Get archived outfits with clothing items
  const { data: outfits, error } = await supabase
    .from('outfits')
    .select(
      `
      *,
      clothing_items (*)
    `
    )
    .eq('user_id', user.id)
    .eq('is_archived', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Archive] Error fetching outfits:', error);
    return {
      outfits: [],
    };
  }

  // Get wear history for all outfits
  const outfitIds = (outfits || []).map((o) => o.id);
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

  // Merge wear stats with outfits
  const outfitsWithStats: OutfitWithStats[] = (outfits || []).map(
    (outfit: { id: string; [key: string]: unknown }) => ({
      ...outfit,
      wear_count: wearStats[outfit.id]?.count || 0,
      last_worn: wearStats[outfit.id]?.lastWorn || null,
      items: outfit.clothing_items || [],
      wear_history: [],
    })
  ) as OutfitWithStats[];

  return {
    outfits: outfitsWithStats,
  };
}

export default async function ArchivePage() {
  const data = await getArchiveData();

  return <ArchiveClient initialOutfits={data.outfits} />;
}
