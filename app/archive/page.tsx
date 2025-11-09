import ArchiveClient from './ArchiveClient';
import { requireAuth } from '@/lib/auth/server';
import { fetchOutfitsWithStats } from '@/lib/data/outfits';

async function getArchiveData() {
  // Authenticate user - Direct Supabase access (2025 pattern)
  const { user, supabase } = await requireAuth();

  // Fetch outfits with stats using shared utility
  const outfitsWithStats = await fetchOutfitsWithStats({
    supabase,
    userId: user.id,
    isArchived: true,
  });

  return {
    outfits: outfitsWithStats,
  };
}

export default async function ArchivePage() {
  const data = await getArchiveData();

  return <ArchiveClient initialOutfits={data.outfits} />;
}
