import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/home';

  console.log('[AUTH CALLBACK] Received callback request');
  console.log('[AUTH CALLBACK] token_hash:', token_hash ? 'present' : 'missing');
  console.log('[AUTH CALLBACK] type:', type);

  if (token_hash && type) {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      });

      if (error) {
        console.error('[AUTH CALLBACK] Verification failed:', error.message);
        return NextResponse.redirect(
          new URL('/auth/login?error=verification_failed', request.url)
        );
      }

      // Note: User profile in public.users is automatically created by database trigger
      // See: supabase/migrations/002_auto_create_user_profile.sql

      console.log('[AUTH CALLBACK] Verification successful, redirecting to:', next);
      return NextResponse.redirect(new URL(next, request.url));
    } catch (error) {
      console.error('[AUTH CALLBACK] Unexpected error:', error);
      return NextResponse.redirect(
        new URL('/auth/login?error=verification_failed', request.url)
      );
    }
  }

  // Missing token or type
  console.warn('[AUTH CALLBACK] Missing token_hash or type parameter');
  return NextResponse.redirect(
    new URL('/auth/login?error=invalid_link', request.url)
  );
}
