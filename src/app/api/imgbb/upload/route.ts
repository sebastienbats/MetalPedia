// src/app/api/imgbb/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      return NextResponse.json({ error: 'Clé API ImgBB manquante dans les variables d\'environnement' }, { status: 500 });
    }

    // Préparation de la requête vers l'API ImgBB
    const imgbbFormData = new FormData();
    imgbbFormData.append('image', file);
    // Optionnel : tu peux ajouter une expiration en secondes ici si tu veux (ex: '604800' pour 7 jours). 
    // Par défaut, c'est permanent.
    // imgbbFormData.append('expiration', '0'); 

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Échec de l\'upload sur ImgBB');
    }

    // data.data.url contient l'URL publique de l'image
    return NextResponse.json({ url: data.data.url });
  } catch (error: any) {
    console.error('Erreur upload ImgBB:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne du serveur' }, { status: 500 });
  }
}
