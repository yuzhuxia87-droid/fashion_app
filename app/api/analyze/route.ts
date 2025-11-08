import { analyzeOutfitImage } from '@/lib/openai/image-analysis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: '画像URLが必要です' },
        { status: 400 }
      );
    }

    // Analyze image with OpenAI
    const analysis = await analyzeOutfitImage(imageUrl);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '画像の解析に失敗しました' },
      { status: 500 }
    );
  }
}
