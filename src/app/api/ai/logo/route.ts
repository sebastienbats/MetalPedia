import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GENRE_STYLES: Record<string, string> = {
  'Black Metal': 'gothic blackletter font, dark atmospheric, inverted crosses, frost and shadows',
  'Death Metal': 'dripping blood letters, horror aesthetic, gore imagery, brutal style',
  'Power Metal': 'epic fantasy, dragons and swords, golden ornate lettering, heroic',
  'Thrash Metal': 'aggressive angular fonts, speed lines, radioactive green, punk attitude',
  'Doom Metal': 'heavy gothic serif, occult symbols, slow and oppressive, dark purple',
};

export async function POST(req: NextRequest) {
  try {
    const { bandName, genre } = await req.json();

    if (!bandName || !genre) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const style = GENRE_STYLES[genre] || 'heavy metal aesthetic';
    const prompt = `Professional heavy metal band logo for "${bandName}" in ${genre} style. ${style}. Ultra detailed, iconic.`;

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      n: 1,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) throw new Error('No image generated');

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Logo generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
