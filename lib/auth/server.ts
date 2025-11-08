/**
 * Server-side authentication utilities
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AuthResult {
  user: User;
  supabase: SupabaseClient;
}

interface AuthResultOptional {
  user: User | null;
  supabase: SupabaseClient;
  error: Error | null;
}

/**
 * Get authenticated user or redirect to login
 * Use this in Server Components that require authentication
 *
 * @throws Redirects to /auth/login if not authenticated
 * @returns Authenticated user and Supabase client
 *
 * @example
 * async function MyPage() {
 *   const { user, supabase } = await requireAuth();
 *   // user is guaranteed to exist here
 * }
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/auth/login');
  }

  return { user, supabase };
}

/**
 * Get authenticated user without redirect (for API routes)
 * Use this in API routes where you want to handle unauthenticated requests
 *
 * @returns User and Supabase client, or null if not authenticated
 *
 * @example
 * export async function GET() {
 *   const { user, supabase, error } = await getAuthUser();
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // Continue with authenticated user
 * }
 */
export async function getAuthUser(): Promise<AuthResultOptional> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return {
      user: null,
      supabase,
      error: error || new Error('Not authenticated')
    };
  }

  return { user, supabase, error: null };
}
