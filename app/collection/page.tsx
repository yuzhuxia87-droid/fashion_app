import CollectionClient from './CollectionClient';
import { FilterTab } from '@/types/extended';
import { requireAuth } from '@/lib/auth/server';
import { OutfitWithStats } from '@/types/api';

async function getCollectionData(filterParam: string | null) {
  // Authenticate user - Direct Supabase access (2025 pattern)
  const { user, supabase } = await requireAuth();

  // Get outfits with clothing items
  const { data: outfits, error } = await supabase
    .from('outfits')
    .select(
      `
      *,
      clothing_items (*)
    `
    )
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Collection] Error fetching outfits:', error);
    return {
      outfits: [],
      initialFilter: 'all' as FilterTab,
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

  const initialFilter: FilterTab =
    filterParam === 'notWornRecently' ? 'notWornRecently' : 'all';

  return {
    outfits: outfitsWithStats,
    initialFilter,
  };
}

export default async function CollectionPage(props: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const searchParams = await props.searchParams;
  const data = await getCollectionData(searchParams.filter || null);

  return (
    <CollectionClient
      initialOutfits={data.outfits}
      initialFilter={data.initialFilter}
    />
  );
}
