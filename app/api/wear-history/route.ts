import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/wear-history
 * Record when an outfit is worn
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authentication check
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

    // Parse request body
    const body = await request.json();
    const { outfit_id, worn_date } = body;

    // Validation
    if (!outfit_id || typeof outfit_id !== 'string') {
      return NextResponse.json(
        { error: 'outfit_idは必須です' },
        { status: 400 }
      );
    }

    if (!worn_date || typeof worn_date !== 'string') {
      return NextResponse.json(
        { error: 'worn_dateは必須です' },
        { status: 400 }
      );
    }

    // Verify outfit belongs to user
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .select('id')
      .eq('id', outfit_id)
      .eq('user_id', user.id)
      .single();

    if (outfitError || !outfit) {
      return NextResponse.json(
        { error: '指定されたコーディネートが見つかりません' },
        { status: 404 }
      );
    }

    // Insert wear history record
    const { error: insertError } = await supabase.from('wear_history').insert({
      outfit_id,
      user_id: user.id,
      worn_date,
    });

    if (insertError) {
      // Check for unique constraint violation (already recorded for this date)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'この日付は既に記録されています' },
          { status: 409 }
        );
      }

      console.error('[WEAR_HISTORY] Insert error:', insertError);
      return NextResponse.json(
        { error: '記録の保存に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: '着用記録を保存しました' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[WEAR_HISTORY] Unexpected error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
