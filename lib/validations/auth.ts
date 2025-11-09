import { z } from 'zod';

/**
 * ログインフォームのバリデーションスキーマ
 */
export const LoginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(6, 'パスワードは6文字以上である必要があります'),
});

/**
 * サインアップフォームのバリデーションスキーマ
 */
export const SignupFormSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(6, 'パスワードは6文字以上である必要があります'),
  confirmPassword: z
    .string()
    .min(1, 'パスワード（確認）を入力してください'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof LoginFormSchema>;
export type SignupFormData = z.infer<typeof SignupFormSchema>;
