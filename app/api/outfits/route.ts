import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
      .eq('is_archived', isArchived)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outfits:', error);
      return NextResponse.json(
        { error: 'コーディネートの取得に失敗しました' },
        { status: 500 }
      );
    }

    // Get wear history for each outfit
    const outfitIds = (outfits || []).map(o => o.id);
    const { data: wearHistory, error: wearError } = await supabase
      .from('wear_history')
      .select('outfit_id, worn_date')
      .in('outfit_id', outfitIds)
      .order('worn_date', { ascending: false });

    if (wearError) {
      console.error('Error fetching wear history:', wearError);
    }

    // Aggregate wear history data
    const wearStats = (wearHistory || []).reduce((acc: any, record: any) => {
      if (!acc[record.outfit_id]) {
        acc[record.outfit_id] = {
          count: 0,
          lastWorn: null,
        };
      }
      acc[record.outfit_id].count++;
      if (!acc[record.outfit_id].lastWorn || record.worn_date > acc[record.outfit_id].lastWorn) {
        acc[record.outfit_id].lastWorn = record.worn_date;
      }
      return acc;
    }, {});

    // Merge wear stats with outfits
    const outfitsWithStats = (outfits || []).map((outfit: any) => ({
      ...outfit,
      wear_count: wearStats[outfit.id]?.count || 0,
      last_worn: wearStats[outfit.id]?.lastWorn || null,
    }));

    return NextResponse.json({
      success: true,
      outfits: outfitsWithStats,
    });
  } catch (error) {
    console.error('Error:', error);
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
      const clothingItems = items.map((item: any) => ({
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
