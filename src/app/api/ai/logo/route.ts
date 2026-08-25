import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface LogoRequest {
  bandName: string;
  genre: string;
}

// ═══════════════════════════════════════════════════════════
// PROMPT GENERATOR
// ═══════════════════════════════════════════════════════════

function generatePrompt(bandName: string, genre: string): string {
  const genreStyles: Record<string, string> = {
    'Black Metal': 'dark, atmospheric, gothic, occult symbols, thorny branches, medieval blackletter font, monochrome with subtle red accents',
    'Death Metal': 'brutal, gory, horror-inspired, dripping blood, skull imagery, distorted grotesque lettering, dark reds and blacks',
    'Power Metal': 'epic, fantasy, heroic, golden light, dragons, swords, ornate serif fonts, majestic blue and gold color scheme',
    'Thrash Metal': 'aggressive, punk-influenced, angular sharp letters, lightning bolts, speed lines, high contrast red and black',
    'Doom Metal': 'occult, slow and heavy atmosphere, ancient runes, smoke, candles, Victorian occult symbols, dark purple and black',
    'Heavy Metal': 'classic metal aesthetic, chrome lettering, lightning, motorcycles, leather, traditional heavy metal font style',
    'Progressive Metal': 'abstract, geometric, futuristic, complex patterns, mathematical symbols, modern typography',
    'Folk Metal': 'celtic knots, viking runes, nature elements, trees, mountains, medieval manuscript style, earthy tones',
    'Symphonic Metal': 'orchestral, gothic cathedral, angelic and demonic imagery, ornate classical typography, purple and gold',
  };

  const styleDescription = genreStyles[genre] || 'classic heavy metal aesthetic, bold lettering, dark atmosphere';

  return `Professional band logo for "${bandName}", ${genre} genre. Style: ${styleDescription}. The logo should be iconic, memorable, and work well at small sizes. Clean vector-style design on transparent or dark background. No photographs, pure graphic design logo.`;
}

// ═══════════════════════════════════════════════════════════
// POST HANDLER
// ═══════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Vérification de la clé API
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parsing du body
    const body: LogoRequest = await request.json();
    const { bandName, genre } = body;

    // Validation des paramètres
    if (!bandName || typeof bandName !== 'string') {
      return NextResponse.json(
        { error: 'bandName is required and must be a string' },
        { status: 400 }
      );
    }

    if (!genre || typeof genre !== 'string') {
      return NextResponse.json(
        { error: 'genre is required and must be a string' },
        { status: 400 }
      );
    }

    // Génération du prompt
    const prompt = generatePrompt(bandName, genre);

    // Appel à l'API OpenAI
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    // ✅ Vérifications robustes pour satisfaire TypeScript strict
    if (!response.data || response.data.length === 0) {
      throw new Error('No image data received from OpenAI');
    }

    const firstImage = response.data[0];
    if (!firstImage) {
      throw new Error('First image is undefined');
    }

    const imageUrl = firstImage.url;
    if (!imageUrl) {
      throw new Error('Image URL is missing from response');
    }

    // Retour de l'URL
    return NextResponse.json({ 
      imageUrl,
      revisedPrompt: firstImage.revised_prompt,
    });

  } catch (error: any) {
    console.error('Logo generation error:', error);

    // Gestion des erreurs spécifiques OpenAI
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      );
    }

    if (error?.code === 'content_policy_violation') {
      return NextResponse.json(
        { error: 'The prompt was rejected by OpenAI content policy. Try a different band name or genre.' },
        { status: 400 }
      );
    }

    // Erreur générique
    return NextResponse.json(
      { error: error?.message || 'Failed to generate logo' },
      { status: 500 }
    );
  }
}
