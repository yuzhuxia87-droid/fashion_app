'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
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
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">メールを確認してください</CardTitle>
              <CardDescription className="text-sm md:text-base">
                アカウントを有効化するための確認メールを送信しました
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8">
              {/* Success Message */}
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm md:text-base text-blue-900">
                  登録が完了しました！メール内のリンクをクリックして、アカウントを有効化してください。
                </AlertDescription>
              </Alert>

              {/* Instructions */}
              <div className="space-y-4 text-sm md:text-base">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">次のステップ:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>メールボックスを確認してください</li>
                    <li>「コーデアプリ」からのメールを開いてください</li>
                    <li>メール内の確認リンクをクリックしてください</li>
                    <li>ログインしてアプリをお楽しみください</li>
                  </ol>
                </div>

                {/* Troubleshooting */}
                <Alert variant="default" className="border-gray-200 bg-gray-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <p className="font-semibold mb-2">メールが届かない場合:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>迷惑メール・スパムフォルダをご確認ください</li>
                      <li>メールアドレスが正しく入力されているかご確認ください</li>
                      <li>数分お待ちいただいてから再度ご確認ください</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link href="/auth/login" className="block">
                  <Button variant="default" className="w-full h-10 md:h-11 text-sm md:text-base">
                    ログインページへ
                  </Button>
                </Link>

                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    メールアドレスが間違っていた場合は{' '}
                    <Link
                      href="/auth/signup"
                      className="text-primary hover:underline font-medium"
                    >
                      もう一度登録
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
