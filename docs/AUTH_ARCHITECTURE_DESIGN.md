# 🏗️ 認証システム アーキテクチャ設計書

## 📋 目的
メール認証フローの体系的な設計と実装指針

---

## 🔍 現状分析

### 発見された問題
1. **新規登録後、ユーザーがログインできない**
   - 原因: Supabaseでメール認証が必須になっている
   - 症状: 「Email not confirmed」エラーが表示されない
   - 影響: ユーザーが混乱し、登録が失敗したと誤解する

### 現在の実装フロー
```
[新規登録画面]
    ↓ ユーザーがフォーム送信
[signupAction]
    ↓ supabase.auth.signUp() → 成功
    ↓ supabase.auth.signInWithPassword() → 失敗（メール未認証）
    ↓ エラーを無視してredirect('/home')
[エラー発生]
    → ユーザーは何が起きたか分からない ❌
```

---

## 🎯 設計方針

### 原則
1. **透明性**: ユーザーに現在の状態を明確に伝える
2. **セキュリティ**: メール認証を必須とする（Supabaseデフォルト）
3. **標準化**: 一般的なWebサービスと同じUXパターン
4. **保守性**: 将来の変更に強い構造

### アーキテクチャ選択: **状態ベースの認証フロー**

```
[登録] → [メール確認待ち] → [ログイン] → [認証済み]
```

---

## 📐 詳細設計

### 1. ファイル構成

```
app/
├── auth/
│   ├── signup/
│   │   ├── page.tsx                    # 新規登録フォーム
│   │   └── actions.ts                  # 🔧 修正: signupAction
│   ├── verify-email/
│   │   └── page.tsx                    # 🆕 新規: メール確認待ち画面
│   ├── login/
│   │   ├── page.tsx                    # ログインフォーム
│   │   └── actions.ts                  # ✅ 既存: loginAction
│   └── callback/
│       └── route.ts                    # 🆕 新規: メール認証コールバック
```

### 2. フローチャート

#### 新規登録フロー（修正後）
```
┌─────────────────────────┐
│  /auth/signup           │
│  新規登録画面           │
└───────────┬─────────────┘
            │ フォーム送信
            ↓
┌─────────────────────────┐
│  signupAction()         │
│  ・バリデーション        │
│  ・signUp()実行         │
│  ・dataを確認           │
└───────────┬─────────────┘
            │
            ↓ data.user.email_confirmed_at をチェック
            │
    ┌───────┴───────┐
    │               │
確認済み          未確認
    │               │
    ↓               ↓
redirect        redirect
/home      /auth/verify-email
                    │
        ┌───────────┴───────────┐
        │ メール確認待ち画面      │
        │ ・案内メッセージ表示    │
        │ ・再送機能             │
        │ ・ログインへのリンク    │
        └───────────────────────┘
```

#### メール認証コールバックフロー
```
[ユーザーがメール内のリンクをクリック]
            ↓
    Supabaseが認証
            ↓
/auth/callback?token=xxx&type=signup
            ↓
┌─────────────────────────┐
│  callback/route.ts      │
│  ・トークン検証         │
│  ・セッション確立       │
└───────────┬─────────────┘
            ↓
     redirect('/home')
```

---

## 🔧 実装詳細

### A. signupAction の修正

**現在の問題箇所:**
```typescript
// Sign up
const { error: signUpError } = await supabase.auth.signUp({
  email,
  password,
});

if (signUpError) {
  return { error: signUpError.message };
}

// Sign in immediately after signup ← ❌ これが失敗する
const { error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (signInError) {
  return { error: signInError.message };
}

redirect('/home'); // ← ❌ 到達しない
```

**修正後:**
```typescript
// Sign up
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

// メール認証が必要かチェック
if (data.user && !data.user.email_confirmed_at) {
  // メール確認待ち画面へリダイレクト
  redirect('/auth/verify-email');
}

// メール認証が不要な場合（開発環境など）
redirect('/home');
```

**ポイント:**
- `data.user.email_confirmed_at` でメール認証状態を確認
- 認証待ちの場合は専用画面へ誘導
- `emailRedirectTo` でコールバックURLを指定

### B. メール確認待ち画面 (`/auth/verify-email`)

**目的:**
- ユーザーにメールを確認するよう促す
- 再送機能を提供
- ログインページへの導線

**UI構成:**
```
┌─────────────────────────────────┐
│  📧 メールを確認してください      │
├─────────────────────────────────┤
│                                 │
│  登録確認メールを送信しました。   │
│  メール内のリンクをクリックして   │
│  アカウントを有効化してください。 │
│                                 │
│  [メールを再送信]                │
│                                 │
│  メールが届かない場合は：         │
│  ・迷惑メールフォルダを確認       │
│  ・メールアドレスが正しいか確認   │
│                                 │
│  確認完了後はこちら → [ログイン]  │
│                                 │
└─────────────────────────────────┘
```

**実装要素:**
1. 情報表示（メールアドレス、案内文）
2. メール再送ボタン
3. ログインページへのリンク
4. トラブルシューティング情報

### C. 認証コールバックハンドラ (`/auth/callback/route.ts`)

**目的:**
- メールリンクからのリダイレクトを処理
- トークンを検証してセッションを確立

**実装:**
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/home';

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // エラー時はログインページへ
  return NextResponse.redirect(new URL('/auth/login?error=verification_failed', request.url));
}
```

**ポイント:**
- トークンとタイプをパラメータから取得
- `verifyOtp()` で検証
- 成功したら指定ページへリダイレクト
- 失敗したらエラーメッセージ付きでログインページへ

---

## 📊 状態遷移図

```
[未登録]
    ↓ 新規登録
[登録済み（メール未確認）]
    ↓ メールリンククリック
[登録済み（メール確認済み）]
    ↓ ログイン
[認証済み]
```

### 各状態での画面

| 状態 | 画面 | 説明 |
|------|------|------|
| 未登録 | `/auth/signup` | 新規登録フォーム |
| メール未確認 | `/auth/verify-email` | メール確認待ち |
| メール確認済み | `/auth/login` | ログインフォーム |
| 認証済み | `/home` | アプリのメイン画面 |

---

## 🔒 セキュリティ考慮事項

### 実装済み
- ✅ Server Actions使用（CSRFプロテクション）
- ✅ Zodバリデーション
- ✅ Supabaseのメール認証

### 追加考慮事項
- ✅ トークンは使い捨て（Supabaseが自動処理）
- ✅ HTTPS必須（本番環境）
- ✅ レート制限（Supabaseが自動処理）

---

## 🧪 テストシナリオ

### 1. 正常系

#### シナリオ1: 新規登録（メール認証あり）
1. `/auth/signup` で登録
2. `/auth/verify-email` にリダイレクト
3. メールを確認
4. リンクをクリック
5. `/home` にリダイレクト
6. ログイン状態で利用開始

#### シナリオ2: ログイン（メール確認済み）
1. `/auth/login` でログイン
2. `/home` にリダイレクト
3. 正常に利用可能

### 2. 異常系

#### シナリオ3: メール未確認でログイン試行
1. 登録後、メール確認せずにログイン
2. エラーメッセージ: 「メールアドレスを確認してください」
3. `/auth/verify-email` へのリンクを表示

#### シナリオ4: 不正なトークン
1. 無効なトークンでコールバック
2. `/auth/login?error=verification_failed` へリダイレクト
3. エラーメッセージ表示

---

## 📝 環境変数

### 必要な追加設定

```env
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000  # 開発環境
# NEXT_PUBLIC_APP_URL=https://your-app.vercel.app  # 本番環境
```

**用途:**
- メール内のコールバックURL生成
- リダイレクト処理

---

## 🚀 段階的実装計画

### フェーズ1: コア機能（優先度: 高）
1. ✅ signupAction修正
2. ✅ verify-email画面作成
3. ✅ callback handler作成

### フェーズ2: UX改善（優先度: 中）
4. ⬜ メール再送機能
5. ⬜ カウントダウンタイマー
6. ⬜ エラーハンドリング強化

### フェーズ3: 高度な機能（優先度: 低）
7. ⬜ メールテンプレートカスタマイズ
8. ⬜ 複数デバイス対応
9. ⬜ 2FA対応

---

## 🔄 既存機能への影響

### 影響なし
- ✅ ログイン機能（メール確認済みユーザー）
- ✅ ログアウト機能
- ✅ 既存の認証済みユーザー

### 影響あり（改善）
- 🔧 新規登録フロー（メール確認待ち画面追加）
- 🔧 エラーメッセージ（より明確に）

---

## 📚 参考資料

### Next.js App Router
- Server Actions
- Route Handlers
- Redirects

### Supabase Auth
- Email Authentication
- Email Templates
- Redirect URLs

### UXパターン
- GitHub: メール確認フロー
- Vercel: 登録プロセス
- Firebase: メール認証UI

---

## ✅ 完了条件

### 機能要件
- [ ] メール認証必須で登録できる
- [ ] メール確認待ち画面が表示される
- [ ] メールリンクからログインできる
- [ ] 適切なエラーメッセージが表示される

### 非機能要件
- [ ] TypeScriptエラーなし
- [ ] ビルド成功
- [ ] レスポンシブ対応
- [ ] アクセシビリティ対応

### テスト
- [ ] 正常系テスト完了
- [ ] 異常系テスト完了
- [ ] 複数ブラウザで確認

---

## 🎯 成功指標

1. **ユーザー混乱の解消**: メール確認が必要であることが明確
2. **登録完了率の向上**: 適切な誘導により登録プロセス完了
3. **サポート問い合わせの減少**: 自己解決可能な情報提供

---

## 📞 次のステップ

1. この設計をレビュー
2. フィードバックを反映
3. フェーズ1の実装開始
4. テスト実施
5. デプロイ

---

**作成日**: 2025-11-11
**バージョン**: 1.0
**レビュアー**: [お客様の確認待ち]
