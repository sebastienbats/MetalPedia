import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Le corps de la requête doit être du JSON' }, { status: 400 });
    }

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

    // 🥊 TENTATIVE 2 : Google Translate (Endpoint non-officiel mais très fiable pour les petits textes)
    try {
      console.log('🥊 Tentative 2: Google Translate (Fallback)...');
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(safeText)}`;
      const googleRes = await fetch(googleUrl, { next: { revalidate: 60 } });
      
      if (googleRes.ok) {
        const googleData = await googleRes.json();
        // Google Translate renvoie un tableau de tableaux. Le texte traduit est dans data[0][0][0]
        if (googleData && googleData[0] && googleData[0][0] && googleData[0][0][0]) {
          // On joint les chunks au cas où le texte est long
          const translatedText = googleData[0].map((chunk: any) => chunk[0]).join('');
          console.log('✅ Google Translate : Succès !');
          return NextResponse.json({ translatedText });
        }
        console.warn('⚠️ Google Translate : Structure de réponse inattendue', googleData);
      } else {
        console.warn(`⚠️ Google Translate : Erreur HTTP ${googleRes.status}`);
      }
    } catch (googleError: any) {
      console.error('❌ Google Translate : Crash de la requête', googleError.message);
    }

    console.error('💥 ÉCHEC TOTAL : Tous les services de traduction ont échoué.');
    return NextResponse.json({ 
      error: 'Les services de traduction sont temporairement indisponibles. Veuillez réessayer dans quelques minutes.' 
    }, { status: 503 });

  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in /api/translate:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne critique du serveur' }, { status: 500 });
  }
}
