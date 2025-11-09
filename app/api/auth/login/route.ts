import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[LOGIN API] Login request received');
    const { email, password } = await request.json();

    if (!email || !password) {
      console.log('[LOGIN API] Missing email or password');
      return NextResponse.json(
        { error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      );
    }

    console.log('[LOGIN API] Creating Supabase client for:', email);
    const supabase = await createClient();

    console.log('[LOGIN API] Attempting signInWithPassword');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[LOGIN API] Login failed:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    console.log('[LOGIN API] Login successful, user ID:', data.user?.id);
    console.log('[LOGIN API] Session exists:', !!data.session);
    console.log('[LOGIN API] Access token exists:', !!data.session?.access_token);

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    console.error('[LOGIN API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}
