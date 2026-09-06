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
  hydrationError: string | null; // 🆕 Gérer les erreurs d'hydratation

  // Actions
  add: (band: BandSearchResult) => void;
  remove: (id: number) => void;
  toggle: (band: BandSearchResult) => void;
  isFavorite: (id: number) => boolean;
  clearAll: () => void;
  syncToCloud: () => Promise<void>;
  setHydrated: () => void;
  setHydrationError: (error: string | null) => void; // 🆕 Action pour les erreurs

  // Getters
  getCount: () => number;
  getAll: () => BandSearchResult[];
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: {},
      hydrated: false,
      hydrationError: null, // 🆕 État initial : pas d'erreur

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
            state?.setHydrationError(error.message);
          } else if (state) {
            state.setHydrated();
          }
        };
      },
    }
  )
);

// ═══════════════════════════════════════════════════════════
// SÉLECTEURS OPTIMISÉS (Hooks simples)
// ═══════════════════════════════════════════════════════════

export const useFavoritesCount = () =>
  useFavoritesStore((s) => Object.keys(s.favorites).length);

export const useFavoriteBands = () =>
  useFavoritesStore((s) => Object.values(s.favorites));

export const useFavoritesHydrated = () =>
  useFavoritesStore((s) => s.hydrated);

// ═══════════════════════════════════════════════════════════
// 🆕 HOOK PERSONNALISÉ AVANCÉ POUR L'HYDRATATION
// ═══════════════════════════════════════════════════════════

/**
 * Hook avancé pour vérifier l'état d'hydratation du store de favoris.
 * 
 * @returns {
 *   isHydrated: boolean - True si les données sont chargées depuis IndexedDB
 *   isLoading: boolean - True pendant le chargement
 *   error: string | null - Message d'erreur si l'hydratation a échoué
 * }
 * 
 * @example
 * ```tsx
 * const { isHydrated, isLoading, error } = useFavoritesHydration();
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * return <FavoritesList />;
 * ```
 */
export function useFavoritesHydration() {
  const hydrated = useFavoritesStore((s) => s.hydrated);
  const error = useFavoritesStore((s) => s.hydrationError);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    // Après le premier rendu, on n'est plus en "chargement initial"
    const timer = setTimeout(() => setIsFirstRender(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return {
    isHydrated: hydrated,
    isLoading: !hydrated && isFirstRender,
    error,
  };
}

/**
 * Hook qui attend que l'hydratation soit terminée avant de retourner les données.
 * Utile pour les composants qui ont besoin des données complètes dès le premier rendu.
 * 
 * @example
 * ```tsx
 * const favorites = useFavoritesWhenReady();
 * // favorites sera [] pendant le chargement, puis les vraies données
 * ```
 */
export function useFavoritesWhenReady(): BandSearchResult[] {
  const { isHydrated } = useFavoritesHydration();
  const favorites = useFavoriteBands();

  if (!isHydrated) return [];
  return favorites;
}
