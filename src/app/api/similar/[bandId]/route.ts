import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { metalServerApi } from '@/lib/metal-api';

// Cache ISR : 1 heure
export const revalidate = 3600;

interface LastfmArtist {
  name: string;
  match: number;
  image_url: string | null;
  url: string | null;
}

interface ResolvedSimilarBand {
  name: string;
  match: number;
  image_url: string | null;
  url: string | null;
  band_id: number | null;     // 🆕 ID Supabase réel ou null
  country?: string;           // 🆕 Enrichi depuis Supabase
  genre?: string;             // 🆕 Enrichi depuis Supabase
  is_cataloged: boolean;      // 🆕 Flag de présence en DB
}

// ═══════════════════════════════════════════════════════════
// RÉSOLUTION BATCH : noms → IDs Supabase
// ═══════════════════════════════════════════════════════════
async function resolveBandIds(names: string[]): Promise<Map<string, { id: number; country: string; genre: string }>> {
  if (names.length === 0) return new Map();

  const result = new Map<string, { id: number; country: string; genre: string }>();

  // Recherche par nom exact (insensible à la casse)
  const { data, error } = await (supabase as any)
    .from('bands')
    .select('id, name, country, genre, listeners')
    .in('lower(name)', names.map(n => n.toLowerCase()));

  if (error || !data) {
    console.warn('Batch resolution failed:', error);
    return result;
  }

  // Regrouper par nom (lowercase) et garder le plus populaire
  const byName = new Map<string, typeof data[0]>();
  for (const band of data) {
    const key = band.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing || (band.listeners || 0) > (existing.listeners || 0)) {
      byName.set(key, band);
    }
  }

  for (const [key, band] of byName) {
    result.set(key, {
      id: band.id,
      country: band.country,
      genre: band.genre,
    });
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// FETCH LAST.FM (artist.getSimilar)
// ═══════════════════════════════════════════════════════════
async function fetchLastfmSimilar(bandName: string, apiKey: string): Promise<LastfmArtist[]> {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&artist=${encodeURIComponent(bandName)}&api_key=${apiKey}&format=json&limit=15`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json();
    const artists = data?.similarartists?.artist || [];

    return artists.map((a: any) => {
      const images = a.image || [];
      const large = images.find((i: any) => i.size === 'large') || images[images.length - 1];
      return {
        name: a.name,
        match: parseFloat(a.match || '0'),
        image_url: large?.['#text'] || null,
        url: a.url || null,
      };
    });
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════
// ROUTE PRINCIPALE
// ═══════════════════════════════════════════════════════════
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bandId: string }> }
) {
  const { bandId } = await params;
  const apiKey = process.env.LASTFM_API_KEY;
  const id = parseInt(bandId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid band ID' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ similar: [] }, { status: 200 });
  }

  try {
    // 1. Récupérer le groupe source
    const band = await metalServerApi.getBand(id);
    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 });
    }

    // 2. Fetch Last.fm
    const lastfmSimilar = await fetchLastfmSimilar(band.name, apiKey);
    if (lastfmSimilar.length === 0) {
      return NextResponse.json({ similar: [] }, { status: 200 });
    }

    // 3. 🆕 Résolution batch des IDs Supabase
    const namesToResolve = lastfmSimilar.map(a => a.name);
    const resolvedMap = await resolveBandIds(namesToResolve);

    // 4. Enrichir chaque similaire avec l'ID résolu
    const similar: ResolvedSimilarBand[] = lastfmSimilar.map(artist => {
      const resolved = resolvedMap.get(artist.name.toLowerCase());
      return {
        ...artist,
        band_id: resolved?.id || null,
        country: resolved?.country,
        genre: resolved?.genre,
        is_cataloged: !!resolved,
      };
    });

    // 📊 Stats pour debug
    const cataloged = similar.filter(s => s.is_cataloged).length;
    console.log(
      `[Similar] ${band.name}: ${cataloged}/${similar.length} groupes résolus en DB`
    );

    return NextResponse.json(
      { similar },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    );
  } catch (err) {
    console.error('[Similar] Error:', err);
    return NextResponse.json({ similar: [] }, { status: 200 });
  }
}
