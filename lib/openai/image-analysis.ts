import OpenAI from 'openai';
import { z } from 'zod';
import { AIAnalysisResult, DetectedItem } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Zod schema for runtime validation
const DetectedItemSchema = z.object({
  category: z.enum(['top', 'bottom', 'outer', 'dress', 'shoes', 'accessory']),
  color: z.string().min(1, '色は必須です'),
  item_type: z.string().min(1, 'アイテムタイプは必須です'),
  confidence: z.number().min(0).max(1),
});

const AIAnalysisResultSchema = z.object({
  items: z.array(DetectedItemSchema).min(1, '最低1つのアイテムが必要です'),
  season: z.enum(['spring', 'summer', 'fall', 'winter', 'all']).optional(),
  style: z.string().optional(),
});

export async function analyzeOutfitImage(
  imageUrl: string
): Promise<AIAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `この画像のコーディネートを分析してください。以下の情報をJSON形式で返してください：

{
  "items": [
    {
      "category": "top" | "bottom" | "outer" | "dress" | "shoes" | "accessory",
      "color": "色（日本語）",
      "item_type": "アイテムの種類（例：Tシャツ、ブラウス、カーディガン、パンツ、スカートなど）",
      "confidence": 0.0-1.0
    }
  ],
  "season": "spring" | "summer" | "fall" | "winter" | "all",
  "style": "スタイルの説明（例：カジュアル、フォーマル、ストリートなど）"
}

注意事項：
- 明確に見える服のみを含めてください
- 色は具体的に（例：白、黒、ネイビー、ベージュ、グレーなど）
- item_typeは日本語で具体的に（例：白いTシャツ、黒いスキニーパンツ、ベージュのカーディガンなど）
- seasonは服の素材感や厚みから判断してください`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;

    // Parse JSON
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('OpenAIのレスポンスをパースできませんでした');
    }

    // Validate with Zod schema
    const validationResult = AIAnalysisResultSchema.safeParse(parsedData);

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.format());
      throw new Error('OpenAIのレスポンスが期待される形式ではありません');
    }

    // Ensure required fields have default values
    return {
      items: validationResult.data.items,
      season: validationResult.data.season || 'all',
      style: validationResult.data.style || 'カジュアル',
    };
  } catch (error) {
    console.error('Error analyzing outfit image:', error);
    throw new Error('画像の解析に失敗しました');
  }
}

export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return (
      response.ok && contentType?.startsWith('image/') === true
    );
  } catch {
    return false;
  }
}

export function mapAIItemToClothingItem(item: DetectedItem) {
  return {
    category: item.category,
    color: item.color,
    item_type: item.item_type,
    has_item: false, // User will confirm
  };
}
