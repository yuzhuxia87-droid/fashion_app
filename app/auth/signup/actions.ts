'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SignupFormSchema } from '@/lib/validations/auth';

export async function signupAction(formData: FormData) {
  // FormDataから値を取得
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };

  // Zodでバリデーション
  const validationResult = SignupFormSchema.safeParse(rawData);

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { error: firstError.message };
  }

  const { email, password } = validationResult.data;

  const supabase = await createClient();

  // Sign up with email redirect configuration
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  // Check if email confirmation is required
  if (data.user && !data.user.email_confirmed_at) {
    // Email confirmation is required - redirect to verify email page
    redirect('/auth/verify-email');
  }

  // If email confirmation is not required (e.g., in development with autoconfirm)
  // Sign in immediately and redirect to home
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: signInError.message };
  }

  redirect('/home');
}
