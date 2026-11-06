import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, source, target } = body;

    if (!text || !source || !target) {
      return NextResponse.json({ error: 'Paramètres manquants : text, source et target sont requis.' }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: 'Le texte est trop long pour la traduction gratuite (max 5000 caractères).' }, { status: 400 });
    }

    // 🥊 TENTATIVE 1 : MyMemory API
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    const myMemoryRes = await fetch(myMemoryUrl);
    
    if (myMemoryRes.ok) {
      const myMemoryData = await myMemoryRes.json();
      if (myMemoryData.responseStatus === 200 && myMemoryData.responseData?.translatedText) {
        return NextResponse.json({ translatedText: myMemoryData.responseData.translatedText });
      }
      console.warn('⚠️ MyMemory a retourné une réponse invalide:', myMemoryData);
    } else {
      console.warn(`⚠️ MyMemory HTTP Error: ${myMemoryRes.status}`);
    }

    // 🥊 TENTATIVE 2 : LibreTranslate (Fallback)
    const libreUrl = 'https://libretranslate.de/translate';
    const libreRes = await fetch(libreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: source,
        target: target,
        format: 'text'
      })
    });

    if (libreRes.ok) {
      const libreData = await libreRes.json();
      if (libreData.translatedText) {
        return NextResponse.json({ translatedText: libreData.translatedText });
      }
    }

    console.error('❌ Les deux services de traduction ont échoué. LibreTranslate response:', await libreRes.text());

    return NextResponse.json({ 
      error: 'Le service de traduction est temporairement indisponible. Veuillez réessayer plus tard.' 
    }, { status: 503 });

  } catch (error: any) {
    console.error('💥 Erreur interne critique dans /api/translate:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne du serveur' }, { status: 500 });
  }
}
