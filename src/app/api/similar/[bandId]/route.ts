import { NextRequest, NextResponse } from 'next/server';

// Cache ISR : 1 heure
export const revalidate = 3600;

interface SimilarBand {
  name: string;
  match: number; // score de similarité 0-1
  image_url: string | null;
  url: string | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bandId: string }> }
) {
  const { bandId } = await params;
  const apiKey = process.env.LASTFM_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ similar: [] }, { status: 200 });
  }

  try {
    // Récupérer le nom du groupe via Supabase
    const { metalServerApi } = await import('@/lib/metal-api');
    const band = await metalServerApi.getBand(parseInt(bandId, 10));

    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 });
    }

    // Appeler Last.fm artist.getSimilar
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&artist=${encodeURIComponent(band.name)}&api_key=${apiKey}&format=json&limit=8`;
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json({ similar: [] }, { status: 200 });
    }

    const data = await res.json();
    const artists = data?.similarartists?.artist || [];

    const similar: SimilarBand[] = artists.map((a: any) => {
      const images = a.image || [];
      const large = images.find((i: any) => i.size === 'large') || images[images.length - 1];

      return {
        name: a.name,
        match: parseFloat(a.match || '0'),
        image_url: large?.['#text'] || null,
        url: a.url || null,
      };
    });

    return NextResponse.json(
      { similar },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    );
  } catch {
    return NextResponse.json({ similar: [] }, { status: 200 });
  }
}
