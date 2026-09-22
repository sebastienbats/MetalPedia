import { NextRequest, NextResponse } from 'next/server';
import { metalServerApi } from '@/lib/metal-api';
import {
  estimateFromLastfm,
  extractFromAcousticBrainz,
  mergeMetrics,
  type AudioFeaturesResponse,
} from '@/lib/audio/audioMetrics';

// Cache ISR : 1 heure (les métriques audio ne changent pas)
export const revalidate = 3600;

const AB_TIMEOUT = 8000;
const LASTFM_TIMEOUT = 5000;

// ═══════════════════════════════════════════════════════════
// FETCH ACOUSTICBRAINZ (via MBID MusicBrainz)
// ═══════════════════════════════════════════════════════════
async function fetchAcousticBrainz(mbid: string) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AB_TIMEOUT);

    const res = await fetch(`https://acousticbrainz.org/api/v1/${mbid}/low-level`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // 404, timeout, réseau → fallback silencieux
  }
}

// ═══════════════════════════════════════════════════════════
// FETCH TAGS LAST.FM (pour le fallback)
// ═══════════════════════════════════════════════════════════
async function fetchLastfmTags(bandName: string): Promise<string[]> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return [];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LASTFM_TIMEOUT);

    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(bandName)}&api_key=${apiKey}&format=json&limit=15`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json();
    const tags = data?.toptags?.tag || [];
    return tags.map((t: any) => t.name).filter(Boolean);
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
  const id = parseInt(bandId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid band ID' }, { status: 400 });
  }

  try {
    const band = await metalServerApi.getBand(id);

    if (!band) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 });
    }

    // 1. Essayer AcousticBrainz si on a un MBID
    let abMetrics = null;
    if (band.mbid) {
      const raw = await fetchAcousticBrainz(band.mbid);
      abMetrics = extractFromAcousticBrainz(raw);
    }

    // 2. Fallback : tags Last.fm + heuristiques de pilier
    const tags = await fetchLastfmTags(band.name);
    const fallback = estimateFromLastfm(band.genre_pillar || 'Heavy Metal', tags, band.name);

    // 3. Fusionner les deux sources
    const { metrics, source, coverage } = mergeMetrics(abMetrics, fallback);

    const response: AudioFeaturesResponse = {
      metrics,
      source,
      coverage,
      mbid: band.mbid || null,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch audio features' }, { status: 502 });
  }
}
