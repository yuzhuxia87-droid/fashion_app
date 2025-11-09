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

  // Sign up
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  // Sign in immediately after signup
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: signInError.message };
  }

  redirect('/home');
}
