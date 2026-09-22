import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { BandDetail, BandSearchResult, Album, BandMember } from '@/types/api';
import type { AudioFeaturesResponse } from '@/lib/audio/audioMetrics';

const API_BASE = '/api';

// ═══════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════
export const QUERY_KEYS = {
  band: (id: number) => ['band', id] as const,
  bandsByGenre: (genre: string) => ['bands', 'genre', genre] as const,
  searchBands: (query: string) => ['bands', 'search', query] as const,
  audioFeatures: (bandId: number) => ['audio-features', bandId] as const,
  similarBands: (bandId: number) => ['similar-bands', bandId] as const,
};

// ═══════════════════════════════════════════════════════════
// TYPE DE RÉPONSE COMPLET POUR BANDE DÉTAILLÉE
// ═══════════════════════════════════════════════════════════
export interface BandDetailResponse {
  band: BandDetail;
  albums: Album[];
  members: BandMember[];
}

// ═══════════════════════════════════════════════════════════
// HOOKS DE RECHERCHE
// ═══════════════════════════════════════════════════════════

export function useSearchBands(
  query: string,
  options?: Omit<UseQueryOptions<BandSearchResult[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.searchBands(query),
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: query.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useBandsByGenre(
  genre: string,
  options?: Omit<UseQueryOptions<BandSearchResult[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.bandsByGenre(genre),
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/search?genre=${encodeURIComponent(genre)}`);
      if (!res.ok) throw new Error('Failed to fetch bands');
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    ...options,
  });
}

// ═══════════════════════════════════════════════════════════
// HOOK BANDE DÉTAILLÉE (avec albums + membres)
// ═══════════════════════════════════════════════════════════

export function useBandDetails(
  bandId: number | undefined,
  options?: Omit<UseQueryOptions<BandDetailResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.band(bandId!),
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/bands/${bandId}`);
      if (!res.ok) throw new Error('Band not found');
      return res.json();
    },
    enabled: !!bandId,
    staleTime: 60 * 60 * 1000,
    ...options,
  });
}

// ═══════════════════════════════════════════════════════════
// 🆕 HOOKS AUDIO & SIMILARITÉ
// ═══════════════════════════════════════════════════════════

export interface SimilarBand {
  name: string;
  match: number;
  image_url: string | null;
  url: string | null;
}

/**
 * Récupère les métriques audio d'un groupe (AcousticBrainz + fallback Last.fm)
 * Cache 1h (données stables pour un groupe donné)
 */
export function useAudioFeatures(
  bandId: number | undefined,
  options?: Omit<UseQueryOptions<AudioFeaturesResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.audioFeatures(bandId!),
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/audio-features/${bandId}`);
      if (!res.ok) throw new Error('Audio features not found');
      return res.json();
    },
    enabled: !!bandId,
    staleTime: 60 * 60 * 1000, // 1h (données stables)
    ...options,
  });
}

/**
 * Récupère les groupes similaires via Last.fm artist.getSimilar
 * Cache 1h (données stables)
 */
export function useSimilarBands(
  bandId: number | undefined,
  options?: Omit<UseQueryOptions<{ similar: SimilarBand[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.similarBands(bandId!),
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/similar/${bandId}`);
      if (!res.ok) return { similar: [] };
      return res.json();
    },
    enabled: !!bandId,
    staleTime: 60 * 60 * 1000,
    ...options,
  });
}
