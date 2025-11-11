# AI生成画像の完全ユーザーフロー検証

## 📱 実際のユーザー体験 - ステップバイステップ

---

## Step 1: AI生成タブを開く

### ユーザーの操作
```
1. 「コーデを探す」画面を開く
2. 「AI生成」タブをクリック
```

### 画面表示
```tsx
// BrowseClient.tsx:429-460
<TabsContent value="generate">
  <Card>
    <Textarea
      placeholder="例: カジュアルな夏のデート服、白いワンピースと麦わら帽子"
    />
    <Button onClick={handleGenerateImage}>
      画像を生成
    </Button>
  </Card>
</TabsContent>
```

### 状態
- ✅ テキストエリアが表示される
- ✅ 「画像を生成」ボタンが表示される
- ✅ エラーなし

---

## Step 2: テキスト入力 → 「画像を生成」ボタンをクリック

### ユーザーの操作
```
1. テキスト入力: "カジュアルな夏のデート服、白いワンピースと麦わら帽子"
2. 「画像を生成」ボタンをクリック
```

### コードの実行フロー

#### 2-1. クライアント側 (BrowseClient.tsx:155-180)
```tsx
const handleGenerateImage = async () => {
  // バリデーション
  if (!generateDescription.trim()) {
    toast.error('説明を入力してください');  // ❌ 空の場合
    return;
  }

  setGenerating(true);  // ✅ ローディング状態ON

  // API呼び出し
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    body: JSON.stringify({ description: generateDescription }),
  });

  const data = await response.json();

  setGeneratedImage(data.imageUrl);  // ✅ 画像URL保存
  toast.success('画像を生成しました！');  // ✅ 成功トースト

  setGenerating(false);  // ✅ ローディング状態OFF
}
```

#### 2-2. サーバー側 (generate-image/route.ts:8-54)
```typescript
export async function POST(request: NextRequest) {
  const { description } = await request.json();

  // プロンプト作成
  const prompt = `A full-body fashion outfit photo featuring: ${description}.
Professional fashion photography style...`;

  // OpenAI DALL-E 3 API呼び出し
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl = response.data[0].url;  // ⚠️ 一時URL取得

  return NextResponse.json({
    success: true,
    imageUrl,  // ⚠️ 一時URLを返す
  });
}
```

### 画面表示の変化
```
[生成中]
ボタン: "生成中..." (無効化)
ローディングアイコン表示

[生成完了]
✅ トースト: "画像を生成しました！"
✅ 生成された画像が表示される
✅ 「この画像を使用」ボタンが表示される
✅ 「別の画像を生成」ボタンが表示される
```

### 状態
- ✅ **成功**: 画像が表示される
- ✅ エラーなし
- ⚠️ **重要**: 画像URLは一時的（OpenAIのCDN）

---

## Step 3: 「この画像を使用」ボタンをクリック

### ユーザーの操作
```
生成された画像の下の「この画像を使用」ボタンをクリック
```

### コードの実行フロー

#### 3-1. クライアント側 (BrowseClient.tsx:182-214)
```tsx
const handleAnalyzeImage = async (imageUrl: string) => {
  setSelectedImage(imageUrl);  // ✅ 選択画像として保存
  setAnalyzing(true);  // ✅ 解析中状態ON
  setAnalysisResult(null);  // リセット

  // API呼び出し
  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ imageUrl }),  // ⚠️ 一時URLを送信
  });

  const data = await response.json();

  setAnalysisResult({
    items: data.analysis.items.map(...),  // ✅ アイテムリスト
    season: data.analysis.season,  // ✅ 季節
    style: data.analysis.style,  // ✅ スタイル
  });

  setAnalyzing(false);  // ✅ 解析完了
}
```

#### 3-2. サーバー側 (analyze/route.ts + image-analysis.ts)

**analyze/route.ts:4-30**
```typescript
export async function POST(request: NextRequest) {
  const { imageUrl } = await request.json();

  // OpenAI Vision API呼び出し
  const analysis = await analyzeOutfitImage(imageUrl);  // ⚠️ 一時URLを使用

  return NextResponse.json({
    success: true,
    analysis,
  });
}
```

**image-analysis.ts:23-105**
```typescript
export async function analyzeOutfitImage(imageUrl: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: '画像分析プロンプト...' },
        {
          type: 'image_url',
          image_url: { url: imageUrl }  // ⚠️ OpenAI一時URLを使用
        }
      ]
    }],
  });

  // レスポンスをパースしてバリデーション
  const parsedData = JSON.parse(jsonString);
  const validationResult = AIAnalysisResultSchema.safeParse(parsedData);

  return {
    items: validationResult.data.items,  // ✅ 検出されたアイテム
    season: validationResult.data.season || 'all',
    style: validationResult.data.style || 'カジュアル',
  };
}
```

### ⚠️ **ここでの重要なポイント**

**OpenAI Vision APIは一時URLを読み込めるか？**
```
✅ はい、読み込めます！

理由:
1. DALL-Eの一時URLは外部からアクセス可能（公開URL）
2. Vision APIは外部URLの画像を解析できる
3. ただし、URLが有効な間のみ（約1時間）
```

### 画面表示の変化
```
[解析中]
ダイアログが開く
画像の上に半透明のオーバーレイ
「AI解析中...」ローディング表示

[解析完了]
✅ 検出されたアイテムのリストが表示
   - カテゴリ、色、アイテム種類
   - チェックボックス（持っているアイテムを選択）
✅ 季節とスタイルのバッジ表示
✅ 「コレクションに保存」ボタン表示
✅ 「アーカイブに保存」ボタン表示
```

### 状態
- ✅ **成功**: 解析結果が表示される
- ✅ エラーなし
- ⚠️ **重要**: まだURLは有効（生成から数分以内）

---

## Step 4: 持っているアイテムをチェック

### ユーザーの操作
```
検出されたアイテムをクリックして、持っているものをチェック
例:
✅ 白いワンピース (持っている)
❌ 麦わら帽子 (持っていない)
```

### コードの実行
```tsx
// BrowseClient.tsx:244-253
const toggleItemOwnership = (index: number) => {
  setAnalysisResult({
    ...analysisResult,
    items: analysisResult.items.map((item, i) =>
      i === index ? { ...item, has_item: !item.has_item } : item
    ),
  });
}
```

### 状態
- ✅ UIが即座に更新される
- ✅ エラーなし
- ✅ ローカル状態のみ変更（まだ保存されていない）

---

## Step 5: 「コレクションに保存」ボタンをクリック

### ユーザーの操作
```
「コレクションに保存」ボタンをクリック
```

### コードの実行フロー

#### 5-1. クライアント側 (BrowseClient.tsx:216-242)
```tsx
const handleSaveOutfit = async (toArchive: boolean = false) => {
  // バリデーション
  if (!selectedImage || !analysisResult) return;

  // API呼び出し
  const response = await fetch('/api/outfits', {
    method: 'POST',
    body: JSON.stringify({
      imageUrl: selectedImage,  // ⚠️ OpenAIの一時URLを送信
      items: analysisResult.items.filter((item) => item.has_item),  // ✅ チェックしたアイテムのみ
      season: analysisResult.season,  // ✅ 季節
      style: analysisResult.style,  // ✅ スタイル
      isArchived: toArchive,  // ✅ false (コレクション)
    }),
  });

  if (!response.ok) throw new Error('Failed to save outfit');

  // 成功処理
  toast.success('コレクションに保存しました');  // ✅ 成功トースト
  setSavedImageIds((prev) => new Set(prev).add(selectedImage));  // ✅ 保存済みマーク
  setSelectedImage(null);  // ✅ ダイアログを閉じる
  setAnalysisResult(null);
}
```

#### 5-2. サーバー側 (outfits/route.ts:45-125)
```typescript
export async function POST(request: NextRequest) {
  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { imageUrl, items, season, style, isArchived } = await request.json();

  // バリデーション
  if (!imageUrl) {
    return NextResponse.json({ error: '画像URLが必要です' }, { status: 400 });
  }

  // ✅ outfitsテーブルに保存
  const { data: outfit, error: outfitError } = await supabase
    .from('outfits')
    .insert({
      user_id: user.id,
      image_url: imageUrl,  // ⚠️ OpenAIの一時URLを保存
      season: season || 'all',
      style: style || null,
      is_archived: false,
      is_favorite: false,
    })
    .select()
    .single();

  // ✅ clothing_itemsテーブルに保存
  if (items && items.length > 0) {
    const clothingItems = items.map((item) => ({
      outfit_id: outfit.id,
      category: item.category,
      color: item.color,
      item_type: item.item_type,
      has_item: item.has_item || false,
    }));

    await supabase.from('clothing_items').insert(clothingItems);
  }

  return NextResponse.json({ success: true, outfit });
}
```

### データベースの状態
```sql
-- outfits テーブル
INSERT INTO outfits (
  user_id,
  image_url,  -- ⚠️ 'https://oaidalleapiprodscus.blob.core.windows.net/...' (一時URL)
  season,
  style,
  is_archived,
  is_favorite
) VALUES (...);

-- clothing_items テーブル
INSERT INTO clothing_items (
  outfit_id,
  category,   -- 'dress'
  color,      -- '白'
  item_type,  -- '白いワンピース'
  has_item    -- true
) VALUES (...);
```

### 画面表示の変化
```
✅ トースト: "コレクションに保存しました"
✅ ダイアログが閉じる
✅ 元の画像一覧に戻る
✅ 保存した画像に緑のチェックマークが表示される
```

### 状態
- ✅ **保存成功!**
- ✅ エラーなし
- ✅ データベースに保存完了
- ⚠️ **しかし**: OpenAIの一時URLがそのまま保存されている

---

## Step 6: すぐにコレクション画面を開く

### ユーザーの操作
```
1. BottomNavで「コレクション」タブをタップ
```

### 画面表示
```
✅ 保存したコーディネートが表示される
✅ 画像が正常に表示される
✅ エラーなし
```

### 状態
- ✅ **正常動作**
- ✅ URLがまだ有効（生成から数分以内）

---

## Step 7: 1時間後にコレクション画面を開く

### ユーザーの操作
```
1時間後または翌日
1. アプリを開く
2. 「コレクション」タブを開く
```

### サーバー側の処理
```typescript
// outfits/route.ts:5-42
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ✅ DBから取得
  const outfitsWithStats = await fetchOutfitsWithStats({
    supabase,
    userId: user.id,
    isArchived: false,
  });

  return NextResponse.json({
    success: true,
    outfits: outfitsWithStats,  // image_url: 'https://oaidalleapiprodscus...' (期限切れURL)
  });
}
```

### ブラウザでの画像読み込み
```tsx
// CollectionClient.tsx 内
<Image
  src={outfit.image_url}  // ⚠️ 期限切れのOpenAI URL
  alt="outfit"
  fill
/>
```

### ブラウザコンソール
```
❌ Failed to load resource:
   the server responded with a status of 403 (Forbidden)

URL: https://oaidalleapiprodscus.blob.core.windows.net/private/...?sig=...

または

❌ Failed to load resource:
   the server responded with a status of 404 (Not Found)
```

### 画面表示
```
❌ 画像が表示されない
   - 灰色のプレースホルダー
   - または壊れた画像アイコン
   - または Next.js の fallback 画像
```

### 状態
- ❌ **画像表示失敗**
- ❌ OpenAI URLが期限切れ
- ✅ 他のデータ（アイテム、季節、スタイル）は正常

---

## 📊 完全なタイムラインまとめ

```
T=0分     : AI生成 ✅
             └→ OpenAI一時URL取得
T=0-1分   : 画像解析 ✅
             └→ 一時URLで解析成功（URLは有効）
T=1-2分   : コレクション保存 ✅
             └→ 一時URLをDBに保存
T=2-5分   : コレクション表示 ✅
             └→ 画像表示成功（URLはまだ有効）

━━━━━━━━━━━━━━━━━━━━━━━━
T=60分    : OpenAI URL期限切れ ⏰
━━━━━━━━━━━━━━━━━━━━━━━━

T=61分以降: コレクション表示 ❌
             └→ 画像表示失敗（URLが無効）
```

---

## 🎯 結論

### ユーザー体験の評価

#### ✅ 短期的には完璧
```
画像生成 → 解析 → 保存 → すぐに見る
→ 全て正常に動作 ✅
```

#### ❌ 長期的には問題
```
翌日コレクションを見る
→ 画像が消えている ❌
→ ユーザー: 「なんで？」😢
```

### エラーメッセージ
```
保存時:   エラーなし ✅
表示時:   エラーなし（単に画像が表示されないだけ）❌
```

### ユーザーの混乱ポイント
```
✅ 「コレクションに保存しました」と表示される
✅ 保存直後は見える
❌ 後で見ると消えている
→ ユーザーは「バグ？」と思う
```

---

## 💡 修正の必要性

### 🔴 優先度: 高

**理由:**
1. ユーザーは「保存成功」と思っている
2. 実際には後で見られない
3. ユーザー体験を大きく損なう
4. 信頼性の問題

### 推奨: すぐに修正

修正により:
- ✅ AI生成画像が永久に残る
- ✅ いつ見ても表示される
- ✅ Supabase Storageに保存
- ✅ ユーザーの信頼を得られる
