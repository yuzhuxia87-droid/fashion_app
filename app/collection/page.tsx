import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CollectionClient from './CollectionClient';
import { OutfitWithStats } from '@/types/api';
import { FilterTab } from '@/types/extended';
import { OutfitsResponseSchema } from '@/lib/validators/api';

async function getCollectionData(filterParam: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Get outfits
  let outfits: OutfitWithStats[] = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/outfits?archived=false`, {
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
    console.error('Error loading outfits:', error);
  }

  // Determine initial filter
  const initialFilter: FilterTab = filterParam === 'notWornRecently' ? 'notWornRecently' : 'all';

  return {
    outfits,
    initialFilter,
  };
}

export default async function CollectionPage(props: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const searchParams = await props.searchParams;
  const data = await getCollectionData(searchParams.filter || null);

  return <CollectionClient initialOutfits={data.outfits} initialFilter={data.initialFilter} />;
}
