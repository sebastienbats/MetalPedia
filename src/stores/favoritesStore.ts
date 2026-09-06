import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { useEffect, useState } from 'react';
import type { BandSearchResult } from '@/types/api';
import { offlineSync } from '@/lib/offline-sync';
import { useGamificationStore } from './gamificationStore';

const idbStore = createStore('metalpedia', 'favorites');

interface FavoritesState {
  favorites: Record<number, BandSearchResult>;
  hydrated: boolean;
  hydrationError: string | null;

  // Actions
  add: (band: BandSearchResult) => void;
  remove: (id: number) => void;
  toggle: (band: BandSearchResult) => void;
  isFavorite: (id: number) => boolean;
  clearAll: () => void;
  syncToCloud: () => Promise<void>;
  setHydrated: () => void;
  setHydrationError: (error: string | null) => void;

  // Getters
  getCount: () => number;
  getAll: () => BandSearchResult[];
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: {},
      hydrated: false,
      hydrationError: null,

      setHydrated: () => set({ hydrated: true }),
      setHydrationError: (error) => set({ hydrationError: error }),

      add: (band) => {
        set((state) => ({
          favorites: { ...state.favorites, [band.id]: band },
        }));

        useGamificationStore.getState().recordFavorite(band.id, true);

        if (!offlineSync.isCurrentlyOnline()) {
          offlineSync.addPendingOperation({
            type: 'favorite_add',
            payload: { band_id: band.id, name: band.name },
          });
        }
      },

      remove: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.favorites;
          return { favorites: rest };
        });

        useGamificationStore.getState().recordFavorite(id, false);

        if (!offlineSync.isCurrentlyOnline()) {
          offlineSync.addPendingOperation({
            type: 'favorite_remove',
            payload: { band_id: id },
          });
        }
      },

      toggle: (band) => {
        const { favorites } = get();
        if (favorites[band.id]) {
          get().remove(band.id);
        } else {
          get().add(band);
        }
      },

      isFavorite: (id) => !!get().favorites[id],
      clearAll: () => set({ favorites: {} }),

      syncToCloud: async () => {
        console.log('Sync favorites to cloud...');
      },

      getCount: () => Object.keys(get().favorites).length,
      getAll: () => Object.values(get().favorites),
    }),
    {
      name: 'metalpedia-favorites',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          try {
            const value = await idbGet(name, idbStore);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('Failed to read from IndexedDB:', error);
            throw error;
          }
        },
        setItem: async (name, value) => {
          try {
            await idbSet(name, JSON.stringify(value), idbStore);
          } catch (err) {
            console.error('Failed to persist favorites:', err);
          }
        },
        removeItem: async (name) => {
          try {
            await idbDel(name, idbStore);
          } catch (err) {
            console.error('Failed to remove favorites:', err);
          }
        },
      })),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Hydration error:', error);
            // 🛡️ CORRECTION : Vérification robuste du type d'erreur pour satisfaire TypeScript
            const errorMessage = error instanceof Error ? error.message : String(error);
            state?.setHydrationError(errorMessage);
          } else if (state) {
            state.setHydrated();
          }
        };
      },
    }
  )
);

// ═══════════════════════════════════════════════════════════
// SÉLECTEURS OPTIMISÉS
// ═══════════════════════════════════════════════════════════

export const useFavoritesCount = () =>
  useFavoritesStore((s) => Object.keys(s.favorites).length);

export const useFavoriteBands = () =>
  useFavoritesStore((s) => Object.values(s.favorites));

export const useFavoritesHydrated = () =>
  useFavoritesStore((s) => s.hydrated);

// ═══════════════════════════════════════════════════════════
// HOOKS PERSONNALISÉS AVANCÉS
// ═══════════════════════════════════════════════════════════

export function useFavoritesHydration() {
  const hydrated = useFavoritesStore((s) => s.hydrated);
  const error = useFavoritesStore((s) => s.hydrationError);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsFirstRender(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return {
    isHydrated: hydrated,
    isLoading: !hydrated && isFirstRender,
    error,
  };
}

export function useFavoritesWhenReady(): BandSearchResult[] {
  const { isHydrated } = useFavoritesHydration();
  const favorites = useFavoriteBands();

  if (!isHydrated) return [];
  return favorites;
}
