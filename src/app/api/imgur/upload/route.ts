// src/app/api/imgur/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    const imgurClientId = process.env.IMGUR_CLIENT_ID;
    if (!imgurClientId) {
      return NextResponse.json({ error: 'Configuration Imgur manquante' }, { status: 500 });
    }

    // Préparation de la requête vers l'API Imgur
    const imgurFormData = new FormData();
    imgurFormData.append('image', image);

    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${imgurClientId}`,
      },
      body: imgurFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.data?.error || 'Échec de l\'upload sur Imgur');
    }

    // data.data.link contient l'URL publique de l'image
    return NextResponse.json({ url: data.data.link });
  } catch (error: any) {
    console.error('Erreur upload Imgur:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
