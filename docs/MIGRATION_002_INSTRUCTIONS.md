# マイグレーション 002: ユーザープロファイル自動作成

## 問題の概要

**エラー内容:**
```
Error creating outfit: {
  code: '23503',
  message: 'insert or update on table "outfits" violates foreign key constraint "outfits_user_id_fkey"'
}
```

**原因:**
- `auth.users` テーブル（Supabase認証）にユーザーは存在
- `public.users` テーブル（アプリケーション）にユーザーが存在しない
- `outfits` テーブルは `public.users` を参照している

**なぜ発生したか:**
- サインアップ時に `public.users` レコードを作成する処理が欠けていた
- 認証は成功するが、アプリケーションデータベースにユーザーが存在しない状態だった

---

## 構造的な解決策

### ❌ **悪い解決法（場当たり的）**

```typescript
// signup/actions.ts
await supabase.from('users').insert(...)

// callback/route.ts
await supabase.from('users').insert(...)

// login/actions.ts
await supabase.from('users').insert(...)
```

**問題:**
- コードが3箇所に重複
- タイミングが不確実
- メンテナンスコスト高
- バグの温床

### ✅ **良い解決法（構造的）**

**Database Trigger による自動化**

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**メリット:**
- ✅ Single Source of Truth（真実の単一ソース）
- ✅ 確実性の保証（auth.users 作成時に必ず public.users も作成）
- ✅ アプリケーションコードから独立
- ✅ パフォーマンス向上
- ✅ メンテナンス容易

---

## マイグレーション実行手順

### Step 1: Supabase ダッシュボードにアクセス

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. 左サイドバーから **SQL Editor** をクリック

### Step 2: マイグレーション SQL を実行

以下のSQLを **SQL Editor** に貼り付けて実行：

```sql
-- Auto-create user profile in public.users when auth.users is created
-- This ensures referential integrity for all tables referencing public.users

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users (one-time migration)
-- This ensures all existing auth.users have corresponding public.users records
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a user profile in public.users when a new user signs up via auth.users. This maintains referential integrity for all tables with foreign keys to public.users.';
```

### Step 3: 実行結果の確認

**成功メッセージ:**
```
Success. No rows returned
```

**エラーが出た場合:**
- エラーメッセージをコピー
- 開発者に報告

### Step 4: 既存ユーザーの確認

以下のSQLで既存ユーザーが正しくマイグレーションされたか確認：

```sql
-- 確認: auth.users と public.users のレコード数が一致するか
SELECT
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count;
```

**期待結果:**
```
auth_users_count | public_users_count
-----------------|-------------------
       2         |        2
```

両方の数値が一致していれば成功です。

---

## 影響範囲

### ✅ **修正されるもの**

1. **新規ユーザー登録**
   - サインアップ時に自動的に `public.users` が作成される
   - コレクション保存が正常に動作

2. **既存ユーザー**
   - バックフィル処理で既存の全ユーザーに `public.users` レコードが作成される
   - 既存ユーザーもコレクション保存が可能に

3. **将来のメンテナンス**
   - アプリケーションコードの変更不要
   - データベースレベルで一貫性が保証される

### ⚠️ **変更されないもの**

- 認証フロー（変更なし）
- ログイン・サインアップの動作（変更なし）
- 既存のコレクションデータ（変更なし）

---

## テスト手順

### Test 1: 新規ユーザー登録

```
1. ログアウト
2. 新規アカウント作成（新しいメールアドレス）
3. メール認証完了
4. ログイン
5. コーデを探す → AI生成 → コレクション保存
   → ✅ 成功するはず
```

### Test 2: 既存ユーザー

```
1. 既存アカウントでログイン
2. コーデを探す → AI生成 → コレクション保存
   → ✅ 成功するはず（バックフィルにより）
```

### Test 3: データベース確認

```sql
-- テスト: 特定ユーザーの public.users レコード存在確認
SELECT * FROM public.users
WHERE email = 'your-email@example.com';
```

**期待結果:**
ユーザーレコードが表示される

---

## ロールバック手順（問題が発生した場合）

```sql
-- Trigger を削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Function を削除
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 注意: バックフィルされた public.users レコードは残る
-- これは問題ない（むしろ必要）
```

---

## 技術的詳細

### Trigger の動作フロー

```
1. ユーザーがサインアップ
   ↓
2. Supabase Auth が auth.users にレコード挿入
   ↓
3. Trigger 発動: on_auth_user_created
   ↓
4. Function 実行: handle_new_user()
   ↓
5. public.users にレコード自動挿入
   ↓
6. アプリケーションは何もしなくても良い
```

### SECURITY DEFINER について

```sql
SECURITY DEFINER
```

- この関数は**関数作成者の権限**で実行される
- RLS（Row Level Security）をバイパスできる
- `public.users` への INSERT が確実に成功する

### ON CONFLICT DO NOTHING について

```sql
ON CONFLICT (id) DO NOTHING
```

- 既にレコードが存在する場合はスキップ
- 冪等性（何度実行しても安全）を保証
- エラーを出さない

---

## まとめ

### Before（問題あり）

```
auth.users
    ↓ (参照)
public.users ← ❌ レコードなし
    ↓ (参照)
outfits ← 💥 外部キー制約エラー
```

### After（修正後）

```
auth.users
    ↓ (Trigger で自動作成)
public.users ← ✅ 必ずレコードあり
    ↓ (参照)
outfits ← ✅ 正常動作
```

**これにより：**
- ✅ 構造的に問題を解決
- ✅ 将来のバグを予防
- ✅ メンテナンスコストを削減
- ✅ 一貫性を保証

---

**作成日**: 2025-11-11
**関連ファイル**: `supabase/migrations/002_auto_create_user_profile.sql`
**優先度**: 🔴 高（本番環境で即座に実行すべき）
