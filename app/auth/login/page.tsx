'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail } from 'lucide-react';
import { loginAction } from './actions';

function LoginForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for error parameters from URL
    const errorParam = searchParams.get('error');
    if (errorParam === 'verification_failed') {
      setError('メール認証に失敗しました。リンクが無効または期限切れの可能性があります。');
    } else if (errorParam === 'invalid_link') {
      setError('無効なリンクです。もう一度お試しください。');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const result = await loginAction(formData);

      if (result?.error) {
        // Check if error is related to email confirmation
        if (result.error.toLowerCase().includes('email') &&
            result.error.toLowerCase().includes('confirm')) {
          setError(
            'メールアドレスの確認が完了していません。受信したメールのリンクをクリックしてください。'
          );
        } else {
          setError(result.error);
        }
      }
      // If successful, loginAction will redirect, so we don't need to do anything here
    } catch (error) {
      console.error('Login error:', error);
      setError('ログインに失敗しました');
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
              <CardTitle className="text-2xl md:text-3xl">ログイン</CardTitle>
              <CardDescription className="text-sm md:text-base">アカウントにログインしてください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm md:text-base">
                    {error}
                    {error.includes('メールアドレスの確認') && (
                      <div className="mt-2">
                        <Link
                          href="/auth/verify-email"
                          className="inline-flex items-center text-sm font-medium hover:underline"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          メール確認ページへ
                        </Link>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
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
                    placeholder="••••••••"
                    className="h-10 md:h-11 text-sm md:text-base"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full h-10 md:h-11 text-sm md:text-base">
                  {loading ? 'ログイン中...' : 'ログイン'}
                </Button>
              </form>

              <div className="text-center text-sm md:text-base">
                <p className="text-muted-foreground">
                  アカウントをお持ちでない方は{' '}
                  <Link
                    href="/auth/signup"
                    className="text-primary hover:underline font-medium"
                  >
                    新規登録
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
