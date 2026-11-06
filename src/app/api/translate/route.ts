import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Vérification stricte du Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Le corps de la requête doit être du JSON' }, { status: 400 });
    }

    // 2. Parsing sécurisé du JSON
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'JSON invalide dans la requête' }, { status: 400 });
    }

    const { text, source, target } = body;

    if (!text || !source || !target) {
      return NextResponse.json({ error: 'Paramètres manquants (text, source, target)' }, { status: 400 });
    }

    console.log(`🌍 [Translation API] Début: ${source} -> ${target} | Longueur: ${text.length} car.`);

    // Sécurité : on tronque à 4000 caractères pour éviter les rejets des API gratuites
    const safeText = text.substring(0, 4000);

    // 🥊 TENTATIVE 1 : MyMemory API
    try {
      console.log('🥊 Tentative 1: MyMemory API...');
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(safeText)}&langpair=${source}|${target}`;
      const myMemoryRes = await fetch(myMemoryUrl, { next: { revalidate: 60 } });
      
      if (myMemoryRes.ok) {
        const myMemoryData = await myMemoryRes.json();
        if (myMemoryData.responseStatus === 200 && myMemoryData.responseData?.translatedText) {
          console.log('✅ MyMemory : Succès !');
          return NextResponse.json({ translatedText: myMemoryData.responseData.translatedText });
        }
        console.warn('⚠️ MyMemory : Réponse invalide', myMemoryData);
      } else {
        console.warn(`⚠️ MyMemory : Erreur HTTP ${myMemoryRes.status}`);
      }
    } catch (myMemoryError: any) {
      console.error('❌ MyMemory : Crash de la requête', myMemoryError.message);
    }

    // 🥊 TENTATIVE 2 : LibreTranslate (Fallback)
    try {
      console.log('🥊 Tentative 2: LibreTranslate API...');
      const libreUrl = 'https://libretranslate.de/translate';
      const libreRes = await fetch(libreUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: safeText,
          source: source,
          target: target,
          format: 'text'
        })
      });

      if (libreRes.ok) {
        const libreData = await libreRes.json();
        if (libreData.translatedText) {
          console.log('✅ LibreTranslate : Succès !');
          return NextResponse.json({ translatedText: libreData.translatedText });
        }
      }
      const libreErrorText = await libreRes.text();
      console.warn(`⚠️ LibreTranslate : Erreur HTTP ${libreRes.status} - ${libreErrorText}`);
    } catch (libreError: any) {
      console.error('❌ LibreTranslate : Crash de la requête', libreError.message);
    }

    console.error('💥 ÉCHEC TOTAL : Les deux services de traduction ont échoué.');
    return NextResponse.json({ 
      error: 'Les services de traduction sont temporairement indisponibles. Veuillez réessayer dans quelques minutes.' 
    }, { status: 503 });

  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in /api/translate:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne critique du serveur' }, { status: 500 });
  }
}
