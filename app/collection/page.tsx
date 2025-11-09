import CollectionClient from './CollectionClient';
import { FilterTab } from '@/types/extended';
import { requireAuth } from '@/lib/auth/server';
import { fetchOutfitsWithStats } from '@/lib/data/outfits';

async function getCollectionData(filterParam: string | null) {
  // Authenticate user - Direct Supabase access (2025 pattern)
  const { user, supabase } = await requireAuth();

  // Fetch outfits with stats using shared utility
  const outfitsWithStats = await fetchOutfitsWithStats({
    supabase,
    userId: user.id,
    isArchived: false,
  });

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
