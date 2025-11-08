import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BrowseClient from './BrowseClient';
import { SearchImage } from '@/types/external';
import { DiscoverImagesResponseSchema } from '@/lib/validators/api';

async function getBrowseData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Get initial discover images
  let images: SearchImage[] = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/discover-images?per_page=20`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const json = await response.json();
      const result = DiscoverImagesResponseSchema.safeParse(json);

      if (result.success) {
        images = result.data.images;
      } else {
        console.error('Invalid API response schema:', result.error);
      }
    }
  } catch (error) {
    console.error('Error loading discover images:', error);
  }

  return {
    images,
  };
}

export default async function BrowsePage() {
  const data = await getBrowseData();

  return <BrowseClient initialImages={data.images} />;
}
