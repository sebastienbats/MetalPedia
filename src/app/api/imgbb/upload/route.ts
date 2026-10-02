import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer le fichier depuis la requête
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // 2. Vérifier la clé API
    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      console.error('❌ Clé API ImgBB manquante dans les variables d\'environnement');
      return NextResponse.json({ error: 'Configuration serveur invalide (Clé API manquante)' }, { status: 500 });
    }

    // 3. Préparer la requête vers l'API ImgBB
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', file);
    
    // Optionnel : Définir une expiration (ex: 604800 secondes = 7 jours) 
    // pour éviter de saturer ton compte ImgBB avec des images inutilisées.
    // Supprime cette ligne si tu veux qu'elles restent indéfiniment.
    // imgbbFormData.append('expiration', '604800'); 

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });

    // 4. Gérer les erreurs de l'API ImgBB
    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Erreur HTTP ImgBB:', response.status, errText);
      throw new Error(`Échec de l'upload vers ImgBB (Statut: ${response.status})`);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      console.error('❌ Réponse ImgBB invalide:', data);
      throw new Error('Réponse inattendue de l\'API ImgBB');
    }

    // 5. ✅ EXTRACTION CRUCIALE DE L'URL DIRECTE
    // data.data.image.url ou data.data.url contient l'URL directe (https://i.ibb.co/.../image.png)
    // et NON l'URL de la page de visualisation (https://ibb.co/...)
    const directImageUrl = data.data.image?.url || data.data.url;

    if (!directImageUrl) {
      throw new Error('Impossible d\'extraire l\'URL directe de l\'image depuis la réponse ImgBB');
    }

    console.log('✅ Image uploadée avec succès:', directImageUrl);

    // 6. Retourner l'URL au frontend
    return NextResponse.json({ 
      url: directImageUrl,
      // On peut aussi retourner ces infos pour un usage futur (ex: bouton de suppression)
      display_url: data.data.display_url,
      delete_url: data.data.delete_url 
    });

  } catch (error: any) {
    console.error('❌ Erreur serveur lors de l\'upload ImgBB:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur lors de l\'hébergement de l\'image' }, 
      { status: 500 }
    );
  }
}
