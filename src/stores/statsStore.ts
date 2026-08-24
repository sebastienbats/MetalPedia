import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StatsState {
  viewedBands: { id: number; name: string; genre: string; country: string; viewedAt: number }[];
  recordView: (band: { id: number; name: string; genre: string; country: string }) => void;
  getGenreBreakdown: () => { genre: string; count: number; percent: number }[];
  getCountryBreakdown: () => { country: string; count: number; percent: number }[];
  getTotalViews: () => number;
}

const MAX_HISTORY = 500;

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      viewedBands: [],

      recordView: (band) => set((state) => ({
        viewedBands: [
          { ...band, viewedAt: Date.now() },
          ...state.viewedBands.filter((b) => b.id !== band.id),
        ].slice(0, MAX_HISTORY),
      })),

      getTotalViews: () => get().viewedBands.length,

      getGenreBreakdown: () => {
        const bands = get().viewedBands;
        if (bands.length === 0) return [];
        const counts: Record<string, number> = {};
        bands.forEach((b) => {
          counts[b.genre] = (counts[b.genre] || 0) + 1;
        });
        return Object.entries(counts)
          .map(([genre, count]) => ({
            genre,
            count,
            percent: Math.round((count / bands.length) * 100),
          }))
          .sort((a, b) => b.count - a.count);
      },

      getCountryBreakdown: () => {
        const bands = get().viewedBands;
        if (bands.length === 0) return [];
        const counts: Record<string, number> = {};
        bands.forEach((b) => {
          counts[b.country] = (counts[b.country] || 0) + 1;
        });
        return Object.entries(counts)
          .map(([country, count]) => ({
            country,
            count,
            percent: Math.round((count / bands.length) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      },
    }),
    { name: 'metalpedia-stats' }
  )
);
