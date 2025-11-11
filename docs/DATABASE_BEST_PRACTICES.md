# データベース設計ベストプラクティス

## 🎯 このドキュメントの目的

このドキュメントは、過去に発生した「public.users レコード欠落バグ」を二度と起こさないための
ベストプラクティスをまとめたものです。

---

## 🚨 過去の重大バグ: public.users レコード欠落

### 発生日
2025-11-11

### 症状
```
Error creating outfit: {
  code: '23503',
  message: 'insert or update on table "outfits" violates foreign key constraint'
}
```

### 根本原因
```
auth.users (Supabase管理)
    ↓ 外部キー参照
public.users (誰が作る？？？) ← 責任が曖昧
    ↓ 外部キー参照
outfits (アプリ管理)
```

**問題:** サインアップ時に `public.users` を作成する処理がなかった

### 解決策
Database Trigger による自動化

---

## ✅ ベストプラクティス

### 1. データの整合性はデータベースレベルで保証する

#### ❌ Bad: アプリケーションコードで管理
```typescript
// signup/actions.ts
await supabase.auth.signUp({ email, password });
await supabase.from('users').insert({ ... }); // 忘れる可能性がある

// callback/route.ts
await supabase.auth.verifyOtp({ ... });
await supabase.from('users').insert({ ... }); // 重複コード

// login/actions.ts
await supabase.auth.signInWithPassword({ ... });
await supabase.from('users').insert({ ... }); // さらに重複
```

**問題:**
- コードの重複
- タイミングの不確実性
- 新しい開発者が見落とす
- OAuth等の追加で漏れる

#### ✅ Good: Database Trigger で自動化
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**メリット:**
- Single Source of Truth
- 100% 確実
- メンテナンス容易
- 将来の拡張に強い

---

### 2. 外部キー制約は必ず設定する

#### ✅ Good
```sql
CREATE TABLE outfits (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ...
);
```

**理由:**
- データの整合性を保証
- 孤立レコードを防ぐ
- 削除時のカスケード処理

---

### 3. Trigger には必ずコメントを付ける

#### ✅ Good
```sql
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'CRITICAL: Auto-creates user profile in public.users.

   DO NOT remove this trigger without understanding the full impact.';
```

**理由:**
- 将来の開発者が誤って削除するのを防ぐ
- Trigger の目的を明確にする

---

### 4. データ整合性チェック関数を用意する

#### ✅ Good
```sql
CREATE FUNCTION validate_user_data_integrity()
RETURNS TABLE(...) AS $$
  -- auth.users と public.users の整合性チェック
$$;
```

**使い方:**
```sql
-- 定期的に実行
SELECT * FROM validate_user_data_integrity();
```

**期待結果:** レコードが返らない = 正常

---

## 📋 新しいテーブルを追加する時のチェックリスト

### 1. 外部キー制約を確認
```sql
-- ✅ 必ず ON DELETE CASCADE を設定
user_id UUID REFERENCES public.users(id) ON DELETE CASCADE
```

### 2. 参照先テーブルの作成を確認
```
Q: user_id は public.users を参照している
Q: public.users はどうやって作成される？
A: on_auth_user_created Trigger で自動作成 ✅
```

### 3. RLS ポリシーを設定
```sql
CREATE POLICY "Users can view own data"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);
```

### 4. インデックスを作成
```sql
CREATE INDEX idx_new_table_user_id ON new_table(user_id);
```

---

## 🔍 データ整合性チェックの実行方法

### 定期的なヘルスチェック

```sql
-- 1. ユーザーデータの整合性確認
SELECT * FROM validate_user_data_integrity();

-- 2. レコード数の確認
SELECT
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.users) as public_users;

-- 3. 孤立レコードの確認
SELECT o.*
FROM outfits o
LEFT JOIN public.users u ON o.user_id = u.id
WHERE u.id IS NULL;
```

**期待結果:** 全て空（レコードなし）

---

## 🚫 絶対にやってはいけないこと

### 1. Trigger の削除
```sql
-- ❌ NEVER DO THIS
DROP TRIGGER on_auth_user_created ON auth.users;
```

**理由:** ユーザー作成フローが壊れる

### 2. 外部キー制約の削除
```sql
-- ❌ NEVER DO THIS
ALTER TABLE outfits DROP CONSTRAINT outfits_user_id_fkey;
```

**理由:** データの整合性が保証されなくなる

### 3. アプリケーションコードから public.users を直接操作
```typescript
// ❌ NEVER DO THIS
await supabase.from('users').insert({
  id: userId,
  email: userEmail
});
```

**理由:** Trigger が責任を持っている。手動操作は不要かつ危険

---

## 📚 参考資料

### Supabase 公式ドキュメント
- [Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data)
- [Database Triggers](https://supabase.com/docs/guides/database/postgres/triggers)

### このプロジェクトの関連ファイル
- `supabase/migrations/002_auto_create_user_profile.sql` - Trigger 定義
- `supabase/migrations/003_add_schema_documentation.sql` - スキーマドキュメント
- `docs/MIGRATION_002_INSTRUCTIONS.md` - マイグレーション手順

---

## 🎓 新しい開発者へのメッセージ

このプロジェクトでは、**データの整合性はデータベースレベルで保証**されています。

特に重要なのは：
1. `auth.users` → `public.users` の自動作成 Trigger
2. 外部キー制約による参照整合性
3. RLS による行レベルセキュリティ

アプリケーションコードは、これらを**信頼**して動作します。
データベースの Trigger や制約を削除・変更する前に、必ず影響範囲を確認してください。

---

**更新日:** 2025-11-11
**作成理由:** public.users レコード欠落バグの再発防止
**優先度:** 🔴 最重要
