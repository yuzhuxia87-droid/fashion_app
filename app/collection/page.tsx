import CollectionClient from './CollectionClient';
import { FilterTab } from '@/types/extended';
import { OutfitsResponseSchema } from '@/lib/validators/api';
import { requireAuth } from '@/lib/auth/server';
import { fetchApiSafe } from '@/lib/api/fetcher';

async function getCollectionData(filterParam: string | null) {
  await requireAuth();

  const { data } = await fetchApiSafe(
    '/api/outfits?archived=false',
    OutfitsResponseSchema
  );

  const initialFilter: FilterTab =
    filterParam === 'notWornRecently' ? 'notWornRecently' : 'all';

  return {
    outfits: data?.outfits || [],
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
