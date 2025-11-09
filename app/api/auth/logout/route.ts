import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('[LOGOUT API] Logout request received');
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[LOGOUT API] Logout failed:', error.message);
      return NextResponse.json(
        { error: 'ログアウトに失敗しました' },
        { status: 500 }
      );
    }

    console.log('[LOGOUT API] Logout successful');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LOGOUT API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    );
  }
}
