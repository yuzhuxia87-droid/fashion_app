import ArchiveClient from './ArchiveClient';
import { OutfitsResponseSchema } from '@/lib/validators/api';
import { requireAuth } from '@/lib/auth/server';
import { fetchApiSafe } from '@/lib/api/fetcher';

async function getArchiveData() {
  await requireAuth();

  const { data } = await fetchApiSafe(
    '/api/outfits?archived=true',
    OutfitsResponseSchema
  );

  return {
    outfits: data?.outfits || [],
  };
}

export default async function ArchivePage() {
  const data = await getArchiveData();

  return <ArchiveClient initialOutfits={data.outfits} />;
}
