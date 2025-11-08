# Gitコミットメッセージテンプレート

このプロジェクトでは、以下の形式でコミットメッセージを書いてください。

## 基本フォーマット

```
<type>: <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Type（必須）

コミットの種類を表すプレフィックス：

- `feat`: 新機能の追加
- `fix`: バグ修正
- `refactor`: リファクタリング（機能変更なし）
- `style`: コードスタイルの変更（フォーマット、セミコロンなど）
- `docs`: ドキュメントのみの変更
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更
- `perf`: パフォーマンス改善
- `ci`: CI/CD設定の変更
- `build`: ビルドシステムや依存関係の変更

## Subject（必須）

- 50文字以内で簡潔に
- 日本語でOK
- 過去形ではなく現在形で書く
  - ✅ `feat: ユーザー認証機能を追加`
  - ❌ `feat: ユーザー認証機能を追加した`

## Body（推奨）

- 何を変更したか（What）
- なぜ変更したか（Why）
- どのように変更したか（How）

変更内容が明確な場合は省略可。

---

## 実例

### 新機能の追加

```
feat: プロフィール編集機能を追加

ユーザーがプロフィール情報を編集できる機能を実装。

変更内容:
- プロフィール編集フォームの作成
- バリデーション処理の追加
- Supabaseへの保存処理

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### バグ修正

```
fix: 画像アップロード時のエラーハンドリング改善

大きな画像をアップロードするとエラーが発生する問題を修正。

原因:
- ファイルサイズのバリデーションが不足していた

修正内容:
- 5MB以上のファイルをアップロード前にチェック
- エラーメッセージを分かりやすく改善

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### リファクタリング

```
refactor: API呼び出しロジックを共通化

重複していたAPI呼び出し処理を共通ユーティリティに抽出。

変更内容:
- lib/api/fetcher.tsを作成
- 4つのページでfetchApiSafeを使用
- コード削減: 200行 → 80行 (60%削減)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## コミットのタイミング

以下のタイミングでコミットすることを推奨：

1. **機能の完成時** - 1つの機能が動作するようになったら
2. **バグ修正後** - テストして動作確認できたら
3. **リファクタリング後** - テストが通ることを確認したら
4. **休憩前** - 作業を中断する前に（途中でも可）

## 避けるべきコミット

- ❌ `fix: 修正` （何を修正したか不明）
- ❌ `update` （何を更新したか不明）
- ❌ `wip` （Work In Progressは避ける。具体的に書く）
- ❌ 複数の無関係な変更を1つのコミットにまとめる

## 良いコミット

- ✅ 1つのコミットに1つの論理的な変更
- ✅ コミットメッセージを読めば変更内容が分かる
- ✅ 他の開発者が理解できる説明
- ✅ 後で振り返った時に分かりやすい

---

## Gitコマンド基本

### ステージング
```bash
# 特定のファイルをステージング
git add path/to/file.ts

# 全ての変更をステージング（慎重に！）
git add .

# 変更を確認
git status
```

### コミット
```bash
# コミット（エディタが開く）
git commit

# 1行でコミット（簡単な変更のみ）
git commit -m "feat: 機能追加"

# 長いメッセージをヒアドキュメントで
git commit -m "$(cat <<'EOF'
feat: プロフィール編集機能を追加

変更内容:
- フォーム作成
- バリデーション追加

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 確認
```bash
# 最近のコミットを表示
git log --oneline -5

# コミットの詳細を表示
git show HEAD

# 差分を確認
git diff
git diff --staged  # ステージング済みの変更
```

---

## 困った時のチェックリスト

### コミット前
- [ ] テストは通りますか？ (`npm run build`)
- [ ] 不要なファイルは含まれていませんか？ (`git status`)
- [ ] コミットメッセージは分かりやすいですか？
- [ ] 1つのコミットに1つの論理的変更ですか？

### コミット後
- [ ] `git log`で確認しましたか？
- [ ] 変更内容に問題はありませんか？

### 間違えた場合
```bash
# 直前のコミットメッセージを修正
git commit --amend

# 直前のコミットを取り消し（変更は残る）
git reset HEAD~1

# 変更を完全に取り消し（危険！）
git reset --hard HEAD~1
```

---

## 参考資料

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git公式ドキュメント](https://git-scm.com/doc)
- このプロジェクトの過去のコミット: `git log --oneline`
