# アーキテクチャ決定記録 (Architecture Decision Records)

## ADR-001: Database Trigger によるユーザープロファイル自動作成

### 状態
✅ 採用（2025-11-11）

### 背景

**問題:**
- `auth.users` (Supabase認証) と `public.users` (アプリケーション) の二重管理
- サインアップ時に `public.users` レコード作成を忘れるバグが発生
- `outfits` テーブルが `public.users` を参照しているため外部キー制約エラー

```
Error: insert or update on table "outfits" violates foreign key constraint
```

**発生原因:**
```
auth.users (Supabase管理)
    ↓ 参照
public.users (誰が作る？) ← 責任が曖昧
    ↓ 参照
outfits (アプリ管理)
```

### 検討した選択肢

#### Option 1: アプリケーションコードで管理 ❌
```typescript
// signup/actions.ts
await supabase.auth.signUp({ ... });
await supabase.from('users').insert({ ... });

// callback/route.ts
await supabase.auth.verifyOtp({ ... });
await supabase.from('users').insert({ ... });

// login/actions.ts
await supabase.auth.signInWithPassword({ ... });
await supabase.from('users').insert({ ... });
```

**デメリット:**
- コードの重複（3箇所以上）
- タイミングの不確実性
- 新しい開発者が見落とす
- OAuth等追加時に漏れる
- メンテナンスコスト高

#### Option 2: Database Trigger で自動化 ✅
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**メリット:**
- Single Source of Truth
- 100% 確実性
- 将来の拡張に強い
- メンテナンス容易
- Supabase公式推奨

### 決定

**Database Trigger による自動化を採用**

### 根拠

1. **データの整合性はデータベースの責務**
   - 外部キー制約と同じレベルで保証すべき
   - アプリケーションレイヤーでは不確実

2. **Supabase ベストプラクティス**
   - [公式ドキュメント](https://supabase.com/docs/guides/auth/managing-user-data) で推奨
   - 多くのプロダクションアプリで採用実績

3. **将来の拡張性**
   - 新しい認証方法（OAuth、Magic Link等）追加時も対応
   - アプリケーションコードの変更不要

4. **保守性**
   - ロジックが1箇所に集約
   - バグ混入のリスク最小化

### 実装

**ファイル:** `supabase/migrations/002_auto_create_user_profile.sql`

**コア機能:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**既存ユーザー対応:**
```sql
-- バックフィル処理
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT au.id, au.email, au.created_at, NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

### 影響範囲

**変更あり:**
- ✅ データベーススキーマ（Trigger追加）
- ✅ `auth.users` → `public.users` の自動作成フロー確立

**変更なし:**
- ✅ アプリケーションコード（修正不要）
- ✅ 認証フロー（変更なし）
- ✅ 既存機能（影響なし）

### 検証方法

```sql
-- データ整合性チェック
SELECT * FROM validate_user_data_integrity();

-- レコード数確認
SELECT
  (SELECT COUNT(*) FROM auth.users) as auth_count,
  (SELECT COUNT(*) FROM public.users) as public_count;
```

期待結果: 両方のカウントが一致

### 今後の展開

この Trigger は以下の場合も自動で動作：
- ✅ 新規サインアップ（メール認証）
- ✅ Google OAuth 認証
- ✅ GitHub OAuth 認証
- ✅ Magic Link 認証
- ✅ その他あらゆる認証方法

### 参考資料

- [Supabase: Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data)
- [PostgreSQL: Triggers](https://www.postgresql.org/docs/current/triggers.html)
- `docs/DATABASE_BEST_PRACTICES.md` - ベストプラクティスガイド
- `docs/MIGRATION_002_INSTRUCTIONS.md` - マイグレーション手順

### レビュー履歴

- 2025-11-11: 初版作成、実装完了
- 評価: ⭐⭐⭐⭐⭐ (構造的に正しい、業界標準)

---

## ADR-002: (将来の決定事項用)

今後、重要なアーキテクチャ決定があればここに追記します。

---

**更新日:** 2025-11-11
**管理者:** Development Team
