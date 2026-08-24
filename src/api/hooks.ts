import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { BandDetail, BandSearchResult } from '@/types/api';

const API_BASE = '/api';

export const QUERY_KEYS = {
  band: (id: number) => ['band', id] as const,
  bandsByGenre: (genre: string) => ['bands', 'genre', genre] as const,
  searchBands: (query: string) => ['bands', 'search', query] as const,
};

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

export function useBandDetails(
  bandId: number | undefined,
  options?: Omit<UseQueryOptions<BandDetail>, 'queryKey' | 'queryFn'>
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
