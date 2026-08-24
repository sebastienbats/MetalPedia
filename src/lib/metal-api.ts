import { getCached, setCache, cacheConfig } from './cache';
import type { BandDetail, BandSearchResult } from '@/types/api';

const API_BASE = 'https://www.metal-api.dev/rest/v1';

async function fetchWithCache<T>(url: string, cacheKey: string, ttl: number): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url, {
    next: { revalidate: Math.floor(ttl / 1000) },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  setCache(cacheKey, data, ttl);
  return data;
}

export const metalServerApi = {
  async getBand(id: number): Promise<BandDetail> {
    return fetchWithCache<BandDetail>(
      `${API_BASE}/bands/${id}`,
      `band:${id}`,
      cacheConfig.band
    );
  },

  async searchBands(query: string): Promise<BandSearchResult[]> {
    return fetchWithCache<BandSearchResult[]>(
      `${API_BASE}/search/bands/name/${encodeURIComponent(query)}`,
      `search:${query}`,
      cacheConfig.search
    );
  },

  async getBandsByGenre(genre: string): Promise<BandSearchResult[]> {
    return fetchWithCache<BandSearchResult[]>(
      `${API_BASE}/search/bands/genre/${encodeURIComponent(genre)}`,
      `genre:${genre}`,
      cacheConfig.genre
    );
  },
};
