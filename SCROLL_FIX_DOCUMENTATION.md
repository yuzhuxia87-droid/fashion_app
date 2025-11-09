# iOSスクロール問題 - 根本原因と恒久的解決策

## 問題の症状
- iPad/iPhoneでページがスクロールできない
- タッチ操作が効かない

## 根本原因（確定）

### 1. viewport設定の問題 (`app/layout.tsx`)
```typescript
// ❌ 問題のある設定
export const viewport: Viewport = {
  maximumScale: 1,        // ズーム完全禁止
  userScalable: false,    // ユーザースケール禁止
};
```

**なぜスクロールが止まるのか**:
- iOS SafariはuserScalable=falseを見ると、タッチイベント全体を制限する
- maximumScale=1も同様の効果を持つ
- これはiOSの仕様であり、バグではない

### 2. CSSのtouch-action設定不足 (`app/globals.css`)
```css
/* 必須の設定が欠けていた */
body {
  touch-action: pan-y pinch-zoom; /* これがないとスクロール不可 */
}
```

## 恒久的解決策

### Step 1: viewport設定の修正 (`app/layout.tsx:22-28`)
```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,      // ✅ 5に変更（アクセシビリティ対応）
  // userScalable削除   // ✅ 完全に削除
  viewportFit: "cover",
  themeColor: "#3b82f6",
};
```

### Step 2: CSSでタッチスクロールを明示 (`app/globals.css:178-197`)
```css
/* iOS/Mobile Scroll Fix */
* {
  -webkit-overflow-scrolling: touch;
}

html,
body {
  overflow-x: hidden;
  overflow-y: auto;
  touch-action: pan-y pinch-zoom;
  overscroll-behavior-y: contain;
}
```

## 再発防止策

### 1. 絶対にやってはいけないこと
- ❌ `userScalable: false`を設定する
- ❌ `maximumScale: 1`を設定する
- ❌ `touch-action: none`を設定する

### 2. 必ずやること
- ✅ viewport設定は上記の「恒久的解決策」のみ使用
- ✅ globals.cssのスクロール設定は削除しない
- ✅ iOSデバイスで実機テスト

### 3. テスト手順
1. iOS Safari / iPadOS Safari で確認
2. Android Chrome で確認
3. 縦スクロールが正常に動作することを確認
4. ピンチズームが動作することを確認（アクセシビリティ）

## チェックリスト

今後、スクロール問題が発生した場合:
- [ ] `app/layout.tsx`のviewport設定を確認
- [ ] `userScalable: false`が含まれていないか確認
- [ ] `maximumScale: 1`になっていないか確認
- [ ] `app/globals.css`のtouch-action設定が存在するか確認
- [ ] ブラウザのハードリフレッシュ（Cmd+Shift+R）を実行
- [ ] 実機でテスト

## 技術的詳細

### iOS Safariの仕様
- `user-scalable=no`が設定されると、Safariはタッチイベントの処理を変更
- これは「ズーム不可 = 固定レイアウト = スクロール不要」と解釈される可能性
- mobile-web-app-capableとの組み合わせでさらに問題が悪化

### 正しい設定の理由
- `maximumScale: 5`: 視覚障害者がズームできるようにする（WCAG準拠）
- `touch-action: pan-y pinch-zoom`: スクロールとズームを明示的に許可
- `-webkit-overflow-scrolling: touch`: iOSネイティブスクロール有効化

## 実機テスト手順（必須）

### ブラウザキャッシュ・Service Workerのクリア

**iOS Safari:**
1. Safariを開く
2. 設定 → Safari → 履歴とWebサイトデータを消去
3. または、開発者メニュー → キャッシュを空にする

**iPad Safari (PWAとして追加している場合):**
1. ホーム画面のアプリを長押し → アプリを削除
2. Safari で再度アクセスし、ホーム画面に追加し直す

**Android Chrome:**
1. Chrome → 設定 → プライバシーとセキュリティ → 閲覧履歴データの削除
2. 「キャッシュされた画像とファイル」を選択して削除

### 検証チェックリスト

実機テスト時に必ず確認すること:

**1. Viewport設定の確認**
```bash
# 開発サーバーで実際のHTMLを確認
curl -s http://localhost:3000/ | grep "viewport"
# 期待される出力:
# <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"/>
```

**2. iOS Safari でのスクロール確認**
- [ ] 縦スクロールが正常に動作する
- [ ] ピンチズームが動作する（2本指で拡大/縮小）
- [ ] ページ上部から下部まで完全にスクロール可能
- [ ] スクロール時に引っかかりや遅延がない
- [ ] オーバースクロール（バウンス）が動作する

**3. 各ページでの動作確認**
- [ ] ホーム(`/home`)
- [ ] コレクション(`/collection`)
- [ ] 探す(`/browse`)
- [ ] アーカイブ(`/archive`)

**4. PWAとしての動作確認**
- [ ] ホーム画面に追加後もスクロールが動作する
- [ ] スタンドアロンモードでスクロールが動作する

### トラブルシューティング

**Q: ハードリフレッシュしてもスクロールできない**
A: Service Worker/PWAキャッシュが原因の可能性
1. アプリをホーム画面から完全に削除
2. Safariの設定 → 履歴とWebサイトデータを消去
3. 再度アクセスしてテスト

**Q: デスクトップではスクロールできるがiOSではできない**
A: viewport設定が正しく適用されていない可能性
1. ビルドキャッシュをクリア: `rm -rf .next`
2. 再ビルド: `npm run build`
3. 開発サーバーを再起動: `npm run dev`

**Q: 一部のページだけスクロールできない**
A: そのページに独自のCSS設定がある可能性
1. Chrome DevTools → Elements → Computed で `overflow`, `touch-action` を確認
2. 親要素に `overflow: hidden` や `touch-action: none` がないか確認

## 参考資料
- [iOS Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/)
- [MDN: touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)
- [WCAG 2.1: Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html)
