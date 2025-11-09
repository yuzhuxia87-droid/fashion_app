import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Create a detailed prompt for DALL-E
    const prompt = `A full-body fashion outfit photo featuring: ${description}.
Professional fashion photography style, clean background, well-lit, realistic clothing details,
suitable for a fashion coordinate app. The outfit should be clearly visible and styled nicely.`;

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageData = response.data?.[0];

    if (!imageData?.url) {
      throw new Error('Failed to generate image');
    }

    const imageUrl = imageData.url;

    return NextResponse.json({
      success: true,
      imageUrl,
      revisedPrompt: imageData.revised_prompt,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
