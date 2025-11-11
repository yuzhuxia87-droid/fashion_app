'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { LoginFormSchema } from '@/lib/validations/auth';

export async function loginAction(formData: FormData) {
  // FormDataから値を取得
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  // Zodでバリデーション
  const validationResult = LoginFormSchema.safeParse(rawData);

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { error: firstError.message };
  }

  const { email, password } = validationResult.data;

  console.log('[LOGIN ACTION] Starting login for:', email);

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[LOGIN ACTION] Login failed:', error.message);
    return { error: error.message };
  }

  console.log('[LOGIN ACTION] Login successful, user ID:', data.user?.id);
  console.log('[LOGIN ACTION] Session exists:', !!data.session);

  // Note: User profile in public.users is automatically created by database trigger
  // See: supabase/migrations/002_auto_create_user_profile.sql

  revalidatePath('/', 'layout');
  redirect('/home');
}
