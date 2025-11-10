import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { fetchOutfitsWithStats } from '@/lib/data/outfits';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isArchived = searchParams.get('archived') === 'true';

    // Use shared utility function to fetch outfits with stats
    const outfitsWithStats = await fetchOutfitsWithStats({
      supabase,
      userId: user.id,
      isArchived,
    });

    return NextResponse.json({
      success: true,
      outfits: outfitsWithStats,
    });
  } catch (error) {
    console.error('Error fetching outfits:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageUrl, items, season, style, isArchived } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: '画像URLが必要です' },
        { status: 400 }
      );
    }

    // Create outfit
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        season: season || 'all',
        style: style || null,
        is_archived: isArchived || false,
        is_favorite: false,
      })
      .select()
      .single();

    if (outfitError) {
      console.error('Error creating outfit:', outfitError);
      return NextResponse.json(
        { error: 'コーディネートの保存に失敗しました' },
        { status: 500 }
      );
    }

    // Create clothing items
    if (items && items.length > 0) {
      const clothingItems = items.map((item: { category: string; color?: string; item_type: string; has_item?: boolean }) => ({
        outfit_id: outfit.id,
        category: item.category,
        color: item.color,
        item_type: item.item_type,
        has_item: item.has_item || false,
      }));

      const { error: itemsError } = await supabase
        .from('clothing_items')
        .insert(clothingItems);

      if (itemsError) {
        console.error('Error creating clothing items:', itemsError);
        // Continue even if items creation fails
      }
    }

    return NextResponse.json({
      success: true,
      outfit,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
