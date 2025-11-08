import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Bot, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            コーデアプリ
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              毎朝の服選びを<br />もっと簡単に
            </h2>
            <p className="text-lg text-muted-foreground">
              AIがあなたのコーディネートを提案。<br />
              天気に合わせた服選びで、毎朝の時間を節約。
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-center">簡単保存</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center text-muted-foreground">
                  お気に入りのコーディネートを画像で保存
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-center">AI提案</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center text-muted-foreground">
                  天気と手持ち服に合わせて最適なコーデを提案
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-center">時短</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center text-muted-foreground">
                  毎朝の服選びを10秒で完了
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4 mt-12">
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/signup">無料で始める</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/login">ログイン</Link>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              ※ 初めての方は、まずコーディネートを3つ保存してみましょう
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 コーデアプリ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
