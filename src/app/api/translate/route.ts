import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, source, target } = await req.json();

    if (!text || !source || !target) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // ✅ SOLUTION 1 : MyMemory API (Gratuit, sans clé API, fiable pour un usage modéré)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200) {
      return NextResponse.json({ translatedText: data.responseData.translatedText });
    } else {
      return NextResponse.json({ error: data.responseDetails || 'Échec de la traduction' }, { status: 500 });
    }

    /* 
    // ✅ SOLUTION 2 : DeepL API Free (Meilleure qualité, nécessite une clé API gratuite)
    // Décommente ce bloc et commente le bloc MyMemory ci-dessus si tu préfères DeepL.
    const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        source_lang: source.toUpperCase(),
        target_lang: target.toUpperCase(),
      }),
    });
    const data = await response.json();
    if (data.translations && data.translations[0]) {
      return NextResponse.json({ translatedText: data.translations[0].text });
    }
    */

  } catch (error) {
    console.error('Erreur de traduction:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
