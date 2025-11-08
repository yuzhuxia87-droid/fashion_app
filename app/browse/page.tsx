import BrowseClient from './BrowseClient';
import { DiscoverImagesResponseSchema } from '@/lib/validators/api';
import { requireAuth } from '@/lib/auth/server';
import { fetchApiSafe } from '@/lib/api/fetcher';

async function getBrowseData() {
  await requireAuth();

  const { data } = await fetchApiSafe(
    '/api/discover-images?per_page=20',
    DiscoverImagesResponseSchema
  );

  return {
    images: data?.images || [],
  };
}

export default async function BrowsePage() {
  const data = await getBrowseData();

  return <BrowseClient initialImages={data.images} />;
}
