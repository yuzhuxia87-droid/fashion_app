'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { signupAction } from './actions';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const result = await signupAction(formData);

      if (result?.error) {
        setError(result.error);
      }
      // If successful, signupAction will redirect, so we don't need to do anything here
    } catch (error) {
      console.error('Signup error:', error);
      setError('登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <Link href="/" className="text-2xl md:text-3xl font-bold text-gray-900">
            コーデアプリ
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="w-full max-w-md lg:max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl md:text-3xl">新規登録</CardTitle>
              <CardDescription className="text-sm md:text-base">アカウントを作成してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm md:text-base">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignup} className="space-y-4 md:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm md:text-base">メールアドレス</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="example@email.com"
                    className="h-10 md:h-11 text-sm md:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm md:text-base">パスワード</Label>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    required
                    minLength={6}
                    placeholder="6文字以上"
                    className="h-10 md:h-11 text-sm md:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm md:text-base">パスワード（確認）</Label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    minLength={6}
                    placeholder="もう一度入力"
                    className="h-10 md:h-11 text-sm md:text-base"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full h-10 md:h-11 text-sm md:text-base">
                  {loading ? '登録中...' : '登録する'}
                </Button>
              </form>

              <div className="text-center text-sm md:text-base">
                <p className="text-muted-foreground">
                  すでにアカウントをお持ちの方は{' '}
                  <Link
                    href="/auth/login"
                    className="text-primary hover:underline font-medium"
                  >
                    ログイン
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
