import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { metalServerApi } from '@/lib/metal-api';

// Cache ISR : 1 heure (les similarités Last.fm sont stables)
export const revalidate = 3600;

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
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
  band_id: number | null;     // ID Supabase réel ou null si non catalogué
  country?: string;           // Enrichi depuis Supabase
  genre?: string;             // Enrichi depuis Supabase
  is_cataloged: boolean;      // Calculé à la volée (pas une colonne DB)
}

interface ResolvedBandInfo {
  id: number;
  country: string;
  genre: string;
}

// ═══════════════════════════════════════════════════════════
// RÉSOLUTION BATCH : noms → IDs Supabase
// ═══════════════════════════════════════════════════════════
// ⚠️ IMPORTANT : Supabase ne supporte PAS .in('lower(name)', ...)
// On utilise .or() avec ilike pour une recherche insensible à la casse
async function resolveBandIds(names: string[]): Promise<Map<string, ResolvedBandInfo>> {
  if (names.length === 0) return new Map();

  const result = new Map<string, ResolvedBandInfo>();

  try {
    // Construit : name.ilike.Iron Maiden,name.ilike.Judas Priest,...
    // Échappe les caractères problématiques pour la syntaxe .or()
    const orCondition = names
      .map(n => `name.ilike.${n.replace(/[,()]/g, ' ').trim()}`)
      .join(',');

    const { data, error } = await (supabase as any)
      .from('bands')
      .select('id, name, country, genre, listeners')
      .or(orCondition);

    if (error) {
      console.error('[Similar] Batch resolution error:', error.message);
      return result;
    }

    if (!data || data.length === 0) {
      console.warn('[Similar] Aucun groupe résolu pour:', names.join(', '));
      return result;
    }

    // Regrouper par nom (lowercase) et garder le plus populaire
    // (gère les doublons : plusieurs groupes avec le même nom)
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

    console.log(`[Similar] ✅ ${result.size}/${names.length} groupes résolus en DB`);
    return result;

  } catch (err) {
    console.error('[Similar] Exception in resolveBandIds:', err);
    return result;
  }
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

    if (!res.ok) {
      console.warn(`[Similar] Last.fm HTTP ${res.status} pour "${bandName}"`);
      return [];
    }

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
  } catch (err) {
    console.warn(`[Similar] Erreur fetch Last.fm pour "${bandName}":`, err);
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

  // Validation de l'ID
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid band ID' }, { status: 400 });
  }

  // Clé API manquante → réponse vide gracieuse
  if (!apiKey) {
    console.warn('[Similar] LASTFM_API_KEY manquante');
    return NextResponse.json({ similar: [] }, { status: 200 });
  }

  try {
    // 1. Récupérer le groupe source depuis Supabase
    const band = await metalServerApi.getBand(id);
    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 });
    }

    // 2. Fetch des groupes similaires via Last.fm
    const lastfmSimilar = await fetchLastfmSimilar(band.name, apiKey);
    if (lastfmSimilar.length === 0) {
      return NextResponse.json({ similar: [] }, { status: 200 });
    }

    // 3. 🎯 Résolution batch des IDs Supabase (1 seule requête SQL)
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
        is_cataloged: !!resolved,  // ✅ Calculé à la volée (pas une colonne DB)
      };
    });

    // 📊 Stats pour debug
    const cataloged = similar.filter(s => s.is_cataloged).length;
    console.log(
      `[Similar] ${band.name}: ${cataloged}/${similar.length} groupes catalogués`
    );

    return NextResponse.json(
      { similar },
      { 
        headers: { 
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' 
        } 
      }
    );
  } catch (err) {
    console.error('[Similar] Erreur globale:', err);
    return NextResponse.json({ similar: [] }, { status: 200 });
  }
}
