# コーデアプリ 🎨👔

毎朝の服選びを簡単にする、AI搭載のコーディネート提案アプリです。

## 特徴

- 📸 **簡単保存**: お気に入りのコーディネートを画像で保存
- 🤖 **AI提案**: 天気と手持ち服に合わせて最適なコーデを提案
- ⏰ **時短**: 毎朝の服選びを10秒で完了
- 🌤️ **天気連携**: 位置情報ベースの天気情報に基づいた提案
- 🧠 **AI画像認識**: OpenAI Vision APIで服のアイテムを自動検出

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: OpenAI GPT-4 Vision API
- **天気API**: 気象庁API（完全無料・APIキー不要）
- **デプロイ**: Vercel (推奨)

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd fashion_app
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルに以下の環境変数を設定してください：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
```

#### 各APIキーの取得方法

**Supabase:**
1. [Supabase](https://supabase.com/)でアカウント作成
2. 新しいプロジェクトを作成
3. Settings > API から URL と anon key を取得
4. SQL Editor で `supabase/migrations/001_initial_schema.sql` を実行

**OpenAI:**
1. [OpenAI Platform](https://platform.openai.com/)でアカウント作成
2. API keys ページで新しいAPIキーを作成

**天気情報:**
- 気象庁APIを使用（完全無料・APIキー不要）
- 日本国内の主要都市（札幌、東京、大阪、福岡など）に対応

### 4. データベースのセットアップ

Supabaseのダッシュボードで以下を実行：

1. SQL Editor を開く
2. `supabase/migrations/001_initial_schema.sql` の内容をコピー＆ペースト
3. Run を クリックしてマイグレーションを実行

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## プロジェクト構成

```
fashion_app/
├── app/                    # Next.js App Router
│   ├── home/              # ホーム画面（提案画面）
│   ├── browse/            # コーデ探し画面
│   ├── collection/        # マイコレクション画面
│   ├── archive/           # アーカイブ画面
│   └── settings/          # 設定画面
├── components/            # 再利用可能なコンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   ├── outfit/           # コーデ関連コンポーネント
│   └── layout/           # レイアウトコンポーネント
├── lib/                   # ユーティリティ関数
│   ├── supabase/         # Supabase クライアント
│   ├── openai/           # OpenAI API連携
│   ├── weather/          # 天気API連携
│   └── recommendations/  # 提案ロジック
├── hooks/                 # カスタムフック
├── types/                 # TypeScript型定義
└── supabase/
    └── migrations/        # DBマイグレーション
```

## 主要機能

### 1. コーディネート提案（ホーム画面）
- 保存したコーデから、天気と着用履歴を考慮して提案
- 昨日・一昨日に着たコーデは除外
- 代替案も表示可能

### 2. コーデ探し
- インスタグラム風のグリッド表示
- 画像アップロード＆AI解析
- 手持ち服チェック機能

### 3. マイコレクション
- 手持ち服で再現可能なコーデ一覧
- お気に入り登録
- 着用記録

### 4. アーカイブ
- 欲しい服リスト
- 将来の参考用コーデ

## データベーススキーマ

主要なテーブル：

- `users`: ユーザー情報（位置情報含む）
- `outfits`: コーディネート情報
- `clothing_items`: 服のアイテム情報
- `wear_history`: 着用履歴

詳細は `supabase/migrations/001_initial_schema.sql` を参照してください。

## デプロイ

### Vercelへのデプロイ（推奨）

1. [Vercel](https://vercel.com/)にログイン
2. プロジェクトをインポート
3. 環境変数を設定
4. デプロイ

環境変数は以下をすべて設定してください：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
（天気APIは気象庁APIを使用するため環境変数不要）

## 開発状況

### Phase 1: 基盤構築 ✅
- [x] Next.js + TypeScript プロジェクト初期化
- [x] Supabase 設定
- [x] データベーススキーマ作成
- [x] 基本ライブラリ（OpenAI, 天気API, 推薦ロジック）

### Phase 2: コア機能（進行中）
- [ ] 画像アップロード機能
- [ ] AI画像解析の統合
- [ ] コーデ保存・一覧表示
- [ ] 手持ち服チェック

### Phase 3: 提案機能
- [ ] 天気API連携
- [ ] 提案ロジック実装
- [ ] 着用記録機能

### Phase 4: 追加機能
- [ ] マイコレクション画面
- [ ] アーカイブ画面
- [ ] 設定画面
- [ ] サンプル画像の組み込み

### Phase 5: 最適化
- [ ] PWA対応
- [ ] パフォーマンス最適化
- [ ] レスポンシブデザイン

## ライセンス

MIT

## 貢献

Pull Requestを歓迎します！

---

Made with ❤️ and Next.js
