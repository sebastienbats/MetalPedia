import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/api/authApi';
import { offlineSync } from '@/lib/offline-sync';

const idbStore = createStore('metalpedia', 'stats');

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
interface ViewedBand {
  id: number;
  name: string;
  genre: string;
  country: string;
  viewedAt: number;
}

interface StatsState {
  viewedBands: ViewedBand[];
  isLoadingCloud: boolean; // ✅ NOUVEAU

  // Actions
  loadFromCloud: () => Promise<void>; // ✅ NOUVEAU
  recordView: (band: Omit<ViewedBand, 'viewedAt'>) => Promise<void>;
  clearHistory: () => Promise<void>;
  _syncViewHistoryToCloud: () => Promise<void>; // ✅ NOUVEAU

  // Getters
  getTotalViews: () => number;
  getGenreBreakdown: () => { genre: string; count: number; percent: number }[];
  getCountryBreakdown: () => { country: string; count: number; percent: number }[];
  getRecentViews: (limit?: number) => ViewedBand[];
  getMostViewedGenre: () => string | null;
}

const MAX_HISTORY = 500;

// ═══════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════
export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      viewedBands: [],
      isLoadingCloud: false,

      // ✅ 1. CHARGEMENT DEPUIS LE CLOUD
      loadFromCloud: async () => {
        const user = await getCurrentUser();
        if (!user) {
          set({ isLoadingCloud: false });
          return;
        }

        set({ isLoadingCloud: true });
        try {
          const { data, error } = await supabase
            .from('user_view_history')
            .select('band_id, band_name, genre, country, viewed_at')
            .eq('user_id', user.id)
            .order('viewed_at', { ascending: false })
            .limit(MAX_HISTORY);

          if (error) throw error;

          if (data) {
            const cloudHistory: ViewedBand[] = data.map((row) => ({
              id: row.band_id,
              name: row.band_name,
              genre: row.genre,
              country: row.country,
              // ✅ CORRECTION : Filet de sécurité si viewed_at est null
              viewedAt: row.viewed_at ? new Date(row.viewed_at).getTime() : Date.now(),
            }));

            set((state) => {
              // Fusion intelligente : garder les plus récents en cas de dépassement
              const merged = [...state.viewedBands];
              
              cloudHistory.forEach((ch) => {
                const exists = merged.some(
                  (m) => m.id === ch.id && m.viewedAt === ch.viewedAt
                );
                if (!exists) {
                  merged.push(ch);
                }
              });

              // Trier par viewedAt décroissant et limiter à MAX_HISTORY
              merged.sort((a, b) => b.viewedAt - a.viewedAt);
              
              return {
                viewedBands: merged.slice(0, MAX_HISTORY),
                isLoadingCloud: false,
              };
            });
          } else {
            set({ isLoadingCloud: false });
          }
        } catch (error) {
          console.error('Erreur chargement view history cloud:', error);
          set({ isLoadingCloud: false });
        }
      },

      // ✅ 2. HELPER DE SYNCHRONISATION
      _syncViewHistoryToCloud: async () => {
        const user = await getCurrentUser();
        if (!user) return;

        const currentHistory = get().viewedBands;
        if (offlineSync.isCurrentlyOnline()) {
          const payload = currentHistory.map((h) => ({
            user_id: user.id,
            band_id: h.id,
            band_name: h.name,
            genre: h.genre,
            country: h.country,
            viewed_at: new Date(h.viewedAt).toISOString(),
          }));

          const { error } = await supabase.from('user_view_history').upsert(payload, {
            onConflict: 'user_id, band_id, viewed_at',
          });

          if (error) console.error('Échec sync view history:', error);
        } else {
          offlineSync.addPendingOperation({
            type: 'view_history_sync',
            payload: currentHistory,
          });
        }
      },

      // ✅ 3. ACTION AVEC MISE À JOUR OPTIMISTE
      recordView: async (band) => {
        const newView: ViewedBand = { ...band, viewedAt: Date.now() };

        // A. Mise à jour locale immédiate
        set((state) => ({
          viewedBands: [
            newView,
            ...state.viewedBands.filter((b) => !(b.id === band.id && b.viewedAt === newView.viewedAt)),
          ].slice(0, MAX_HISTORY),
        }));

        // B. Synchronisation en arrière-plan
        await get()._syncViewHistoryToCloud();
      },

      clearHistory: async () => {
        // A. Mise à jour locale immédiate
        set({ viewedBands: [] });

        // B. Nettoyer aussi côté cloud si l'utilisateur est connecté
        const user = await getCurrentUser();
        if (user) {
          await supabase.from('user_view_history').delete().eq('user_id', user.id);
        }
      },

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

      getRecentViews: (limit = 10) => {
        return get().viewedBands.slice(0, limit);
      },

      getMostViewedGenre: () => {
        const breakdown = get().getGenreBreakdown();
        return breakdown.length > 0 ? breakdown[0].genre : null;
      },
    }),
    {
      name: 'metalpedia-stats',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          try {
            const value = await idbGet(name, idbStore);
            return value ? JSON.parse(value) : null;
          } catch { return null; }
        },
        setItem: async (name, value) => {
          try { await idbSet(name, JSON.stringify(value), idbStore); }
          catch (err) { console.error('Failed to persist stats:', err); }
        },
        removeItem: async (name) => {
          try { await idbDel(name, idbStore); }
          catch (err) { console.error('Failed to remove stats:', err); }
        },
      })),
    }
  )
);

// ═══════════════════════════════════════════════════════════
// HOOKS SÉLECTEURS
// ═══════════════════════════════════════════════════════════
export const useTotalViews = () => useStatsStore((s) => s.viewedBands.length);
export const useGenreBreakdown = () => useStatsStore((s) => s.getGenreBreakdown());
export const useStatsIsLoading = () => useStatsStore((s) => s.isLoadingCloud);
