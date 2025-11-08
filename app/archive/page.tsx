import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ArchiveClient from './ArchiveClient';
import { OutfitWithStats } from '@/types/api';
import { OutfitsResponseSchema } from '@/lib/validators/api';

async function getArchiveData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Get archived outfits
  let outfits: OutfitWithStats[] = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/outfits?archived=true`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const json = await response.json();
      const result = OutfitsResponseSchema.safeParse(json);

      if (result.success) {
        outfits = result.data.outfits;
      } else {
        console.error('Invalid API response schema:', result.error);
      }
    }
  } catch (error) {
    console.error('Error loading archived outfits:', error);
  }

  return {
    outfits,
  };
}

export default async function ArchivePage() {
  const data = await getArchiveData();

  return <ArchiveClient initialOutfits={data.outfits} />;
}
