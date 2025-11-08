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

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error('Failed to generate image');
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      revisedPrompt: response.data[0]?.revised_prompt,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
