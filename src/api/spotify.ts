import { useQuery } from '@tanstack/react-query';

const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface AudioFeatures {
  artist_id: string;
  track_count: number;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
}

export interface SimilarBand {
  name: string;
  genre: string;
  country: string;
  similarity_score: number;
}

// ═══════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════

export async function fetchAudioFeatures(bandName: string): Promise<AudioFeatures | null> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/audio-features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ band_name: bandName }),
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`API error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Spotify fetch error:', error);
    return null;
  }
}

export async function fetchSimilarBands(
  band: { band_id: number; name: string; genre: string; country: string },
  limit = 10
): Promise<SimilarBand[]> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/similar-bands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ band, limit }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    return data.recommendations || [];
  } catch (error) {
    console.error('Similar bands fetch error:', error);
    return [];
  }
}

// ═══════════════════════════════════════════
// INTERPRETATION HELPERS
// ═══════════════════════════════════════════

export function interpretFeatures(features: AudioFeatures): string[] {
  const insights: string[] = [];

  if (features.energy > 0.8) insights.push('⚡ Énergie explosive');
  if (features.energy < 0.3) insights.push('🌙 Ambiance calme et posée');
  if (features.valence < 0.3) insights.push('🌑 Ambiance sombre et mélancolique');
  if (features.valence > 0.7) insights.push('☀️ Ambiance positive et épique');
  if (features.acousticness > 0.5) insights.push('🎻 Forte présence acoustique');
  if (features.instrumentalness > 0.5) insights.push('🎸 Tendance instrumentale');
  if (features.tempo > 160) insights.push('🔥 Tempo très rapide (blast beats probables)');
  if (features.tempo < 90) insights.push('🐢 Tempo lent et pesant (doom vibes)');
  if (features.liveness > 0.8) insights.push('🎤 Son live prédominant');
  if (features.danceability > 0.6) insights.push('💃 Étonnamment dansant pour du metal');
  if (features.loudness > -5) insights.push('🔊 Production très compressée');

  return insights;
}

// ═══════════════════════════════════════════
// REACT QUERY HOOKS
// ═══════════════════════════════════════════

export function useAudioFeatures(bandName: string | undefined) {
  return useQuery({
    queryKey: ['audio-features', bandName],
    queryFn: () => fetchAudioFeatures(bandName!),
    enabled: !!bandName,
    staleTime: 24 * 60 * 60 * 1000, // 24h
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 jours
  });
}

export function useSimilarBands(
  band: { band_id: number; name: string; genre: string; country: string } | undefined,
  limit = 10
) {
  return useQuery({
    queryKey: ['similar-bands', band?.band_id],
    queryFn: () => fetchSimilarBands(band!, limit),
    enabled: !!band,
    staleTime: 60 * 60 * 1000, // 1h
  });
}
