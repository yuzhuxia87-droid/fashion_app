import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/outfits/[id]
 * Delete an outfit and its associated data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get the outfit ID from params
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'IDが無効です' },
        { status: 400 }
      );
    }

    // Verify outfit exists and belongs to user
    const { data: outfit, error: fetchError } = await supabase
      .from('outfits')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !outfit) {
      return NextResponse.json(
        { error: '指定されたコーディネートが見つかりません' },
        { status: 404 }
      );
    }

    // Delete the outfit
    // Note: clothing_items and wear_history are cascaded due to ON DELETE CASCADE
    const { error: deleteError } = await supabase
      .from('outfits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[OUTFIT_DELETE] Delete error:', deleteError);
      return NextResponse.json(
        { error: '削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'コーディネートを削除しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[OUTFIT_DELETE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
