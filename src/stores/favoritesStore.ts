import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import type { BandSearchResult } from '@/types/api';
import { offlineSync } from '@/lib/offline-sync';
import { useGamificationStore } from './gamificationStore';

const idbStore = createStore('metalpedia', 'favorites');

interface FavoritesState {
  favorites: Record<number, BandSearchResult>;
  hydrated: boolean; // 🆕 Indicateur de chargement depuis IndexedDB

  // Actions
  add: (band: BandSearchResult) => void;
  remove: (id: number) => void;
  toggle: (band: BandSearchResult) => void;
  isFavorite: (id: number) => boolean;
  clearAll: () => void;
  syncToCloud: () => Promise<void>;
  setHydrated: () => void; // 🆕 Action pour marquer l'hydratation comme terminée

  // Getters
  getCount: () => number;
  getAll: () => BandSearchResult[];
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: {},
      hydrated: false, // 🆕 État initial : pas encore chargé depuis IndexedDB

      setHydrated: () => set({ hydrated: true }), // 🆕 Action

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
          } catch {
            return null;
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
      // 🆕 Hook Zustand appelé automatiquement quand la réhydratation est terminée
      onRehydrateStorage: () => {
        return (state, error) => {
          if (state) {
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

// 🆕 Sélecteur pour savoir si le store a fini de charger depuis IndexedDB
export const useFavoritesHydrated = () =>
  useFavoritesStore((s) => s.hydrated);
