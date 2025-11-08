# 開発ガイド - 新人エンジニア向け

このプロジェクトで開発を始める際に知っておくべきことをまとめています。

## 目次

1. [プロジェクト構成](#プロジェクト構成)
2. [技術スタック](#技術スタック)
3. [開発フロー](#開発フロー)
4. [コーディング規約](#コーディング規約)
5. [よくある作業](#よくある作業)
6. [トラブルシューティング](#トラブルシューティング)

---

## プロジェクト構成

```
fashion_app/
├── app/                      # Next.js App Router
│   ├── home/                # ホーム画面
│   │   ├── page.tsx         # Server Component (データ取得)
│   │   └── HomeClient.tsx   # Client Component (インタラクション)
│   ├── collection/          # コレクション画面
│   ├── browse/              # 探す画面
│   ├── archive/             # アーカイブ画面
│   └── api/                 # APIルート
│       ├── outfits/         # コーデAPI
│       ├── recommendations/ # レコメンドAPI
│       └── ...
├── components/              # 共通コンポーネント
│   ├── ui/                  # shadcn/ui コンポーネント
│   ├── BottomNav.tsx        # 下部ナビゲーション
│   ├── PageHeader.tsx       # ページヘッダー
│   └── ...
├── lib/                     # ユーティリティ
│   ├── auth/                # 認証関連
│   │   └── server.ts        # requireAuth(), getAuthUser()
│   ├── api/                 # API関連
│   │   ├── fetcher.ts       # fetchApiSafe(), buildQueryString()
│   │   └── responses.ts     # successResponse(), errorResponse()
│   ├── validators/          # バリデーション
│   │   └── api.ts           # Zodスキーマ
│   ├── supabase/            # Supabase
│   └── ...
├── types/                   # 型定義
│   ├── index.ts             # 基本型
│   ├── api.ts               # API型
│   └── extended.ts          # 拡張型
└── public/                  # 静的ファイル
```

---

## 技術スタック

| 技術 | 用途 | ドキュメント |
|------|------|-------------|
| **Next.js 16** | フレームワーク | [Docs](https://nextjs.org/docs) |
| **React 19** | UI構築 | [Docs](https://react.dev) |
| **TypeScript** | 型安全性 | [Docs](https://www.typescriptlang.org/docs/) |
| **Tailwind CSS** | スタイリング | [Docs](https://tailwindcss.com/docs) |
| **shadcn/ui** | UIコンポーネント | [Docs](https://ui.shadcn.com) |
| **Supabase** | バックエンド・DB | [Docs](https://supabase.com/docs) |
| **Zod** | バリデーション | [Docs](https://zod.dev) |
| **Sonner** | トースト通知 | [Docs](https://sonner.emilkowal.ski) |

---

## 開発フロー

### 1. セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd fashion_app

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集して必要な値を設定

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

### 2. ブランチ戦略

```bash
# 新しい機能を開発
git checkout -b feature/機能名

# バグ修正
git checkout -b fix/バグ名

# リファクタリング
git checkout -b refactor/対象
```

### 3. 開発サイクル

1. **機能を実装**
   - Server ComponentまたはClient Componentを作成
   - 必要に応じてAPIルートを追加

2. **テスト**
   ```bash
   npm run build  # ビルドエラーがないか確認
   ```

3. **コミット**
   ```bash
   git add <変更したファイル>
   git commit  # COMMIT_MESSAGE_TEMPLATE.mdを参照
   ```

4. **プッシュ**
   ```bash
   git push origin <ブランチ名>
   ```

---

## コーディング規約

### 1. Server Component vs Client Component

#### Server Component（デフォルト）
- データ取得を行う
- 認証チェックを行う
- `'use client'`ディレクティブ**なし**

```typescript
// app/example/page.tsx
import { requireAuth } from '@/lib/auth/server';
import { fetchApiSafe } from '@/lib/api/fetcher';
import ExampleClient from './ExampleClient';

async function getData() {
  await requireAuth();  // 認証チェック

  const { data } = await fetchApiSafe('/api/example', ExampleSchema);

  return {
    items: data?.items || [],
  };
}

export default async function ExamplePage() {
  const data = await getData();
  return <ExampleClient data={data} />;
}
```

#### Client Component
- インタラクション（クリック、フォーム送信など）
- useStateや他のReact Hooks
- `'use client'`ディレクティブ**あり**

```typescript
// app/example/ExampleClient.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ExampleClient({ data }) {
  const [count, setCount] = useState(0);

  return (
    <Button onClick={() => setCount(count + 1)}>
      {count}
    </Button>
  );
}
```

### 2. API呼び出し

**Server Componentで使用:**

```typescript
import { fetchApiSafe } from '@/lib/api/fetcher';
import { ExampleSchema } from '@/lib/validators/api';

// パターン1: シンプルなGET
const { data, error } = await fetchApiSafe('/api/example', ExampleSchema);

// パターン2: クエリパラメータ付き
import { buildQueryString } from '@/lib/api/fetcher';

const query = buildQueryString({ page: 1, limit: 10 });
const { data } = await fetchApiSafe(`/api/example${query}`, ExampleSchema);

// エラーハンドリング
if (error) {
  console.error('Failed to fetch:', error);
  return { items: [] };  // フォールバック
}

return { items: data.items };
```

**Client Componentで使用:**

```typescript
'use client';

const response = await fetch('/api/example', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'test' }),
});

if (!response.ok) {
  throw new Error('Failed to save');
}

const result = await response.json();
```

### 3. 認証

**Server Component:**

```typescript
import { requireAuth } from '@/lib/auth/server';

// 認証が必要なページ
async function MyPage() {
  const { user, supabase } = await requireAuth();
  // user は必ず存在する（認証されていなければリダイレクト）
}
```

**APIルート:**

```typescript
import { getAuthUser } from '@/lib/auth/server';
import { unauthorizedResponse } from '@/lib/api/responses';

export async function GET() {
  const { user, supabase, error } = await getAuthUser();

  if (!user) {
    return unauthorizedResponse();
  }

  // 認証済みユーザーの処理
}
```

### 4. 型定義

**Zodスキーマを定義（必須）:**

```typescript
// lib/validators/api.ts
import { z } from 'zod';

export const ExampleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  count: z.number().int().nonnegative(),
});

export const ExampleResponseSchema = z.object({
  success: z.boolean().optional(),
  items: z.array(ExampleSchema),
});
```

**TypeScript型をエクスポート:**

```typescript
// types/api.ts
export interface ExampleItem {
  id: string;
  name: string;
  count: number;
}
```

### 5. エラーハンドリング

**APIルート:**

```typescript
import { withErrorHandling, successResponse, badRequestResponse } from '@/lib/api/responses';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();

    if (!body.name) {
      return badRequestResponse('名前は必須です');
    }

    // 処理...

    return successResponse({ item });
  });
}
```

---

## よくある作業

### 新しいページを追加

1. **Server Componentを作成**

```typescript
// app/new-page/page.tsx
import { requireAuth } from '@/lib/auth/server';
import NewPageClient from './NewPageClient';

async function getData() {
  await requireAuth();
  return { message: 'Hello' };
}

export default async function NewPage() {
  const data = await getData();
  return <NewPageClient data={data} />;
}
```

2. **Client Componentを作成**

```typescript
// app/new-page/NewPageClient.tsx
'use client';

import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';

export default function NewPageClient({ data }) {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="新しいページ" />
      <main className="max-w-7xl mx-auto px-5 py-6 pb-24">
        <p>{data.message}</p>
      </main>
      <BottomNav />
    </div>
  );
}
```

### 新しいAPIエンドポイントを追加

```typescript
// app/api/new-endpoint/route.ts
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import {
  withErrorHandling,
  successResponse,
  unauthorizedResponse
} from '@/lib/api/responses';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { user, supabase } = await getAuthUser();

    if (!user) {
      return unauthorizedResponse();
    }

    // データ取得
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return successResponse({ items: data });
  });
}
```

### Zodスキーマを追加

```typescript
// lib/validators/api.ts

// 既存のスキーマの下に追加
export const NewItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  created_at: z.string(),
});

export const NewItemsResponseSchema = z.object({
  success: z.boolean().optional(),
  items: z.array(NewItemSchema),
});
```

---

## トラブルシューティング

### ビルドエラー

```bash
# 型エラーを確認
npx tsc --noEmit

# キャッシュをクリア
rm -rf .next
npm run dev
```

### 認証エラー

```
Error: Not authenticated
```

→ `.env.local`にSupabaseの環境変数が設定されているか確認

### APIエラー

```
API fetch error: { error: ApiFetchError }
```

→ ブラウザの開発者ツールのNetworkタブでリクエスト/レスポンスを確認

### データベースエラー

→ Supabaseダッシュボードでテーブル構造とRLS（Row Level Security）を確認

---

## 便利なコマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 型チェック
npx tsc --noEmit

# リンターチェック
npm run lint

# コードフォーマット
npm run format  # (設定されている場合)

# Gitの状態確認
git status
git log --oneline -10

# 変更の差分確認
git diff
git diff --staged
```

---

## 質問・相談

わからないことがあれば、以下を確認してください：

1. **このドキュメント** - よくある作業パターンを参照
2. **コミット履歴** - `git log`で過去の実装を参照
3. **既存のコード** - 似た機能の実装を探す
4. **公式ドキュメント** - 技術スタックの表を参照

それでも解決しない場合は、チームメンバーに質問してください！

---

**Happy Coding! 🚀**
