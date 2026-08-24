import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import type { BandSearchResult } from '@/types/api';
import { offlineSync } from '@/lib/offline-sync';
import { useGamificationStore } from './gamificationStore';

const idbStore = createStore('metalpedia', 'favorites');

interface FavoritesState {
  favorites: Record<number, BandSearchResult>;

  // Actions
  add: (band: BandSearchResult) => void;
  remove: (id: number) => void;
  toggle: (band: BandSearchResult) => void;
  isFavorite: (id: number) => boolean;
  clearAll: () => void;
  syncToCloud: () => Promise<void>;

  // Getters
  getCount: () => number;
  getAll: () => BandSearchResult[];
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: {},

      add: (band) => {
        set((state) => ({
          favorites: { ...state.favorites, [band.id]: band },
        }));

        // Gamification : XP pour ajout de favori
        useGamificationStore.getState().recordFavorite(band.id, true);

        // Offline sync : si hors ligne, enregistrer l'opération
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

        // Gamification : XP retiré
        useGamificationStore.getState().recordFavorite(id, false);

        // Offline sync
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
        // Sync avec Supabase si user connecté
        // Implémentation à connecter avec authApi
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
    }
  )
);

// Sélecteurs optimisés
export const useFavoritesCount = () =>
  useFavoritesStore((s) => Object.keys(s.favorites).length);

export const useFavoriteBands = () =>
  useFavoritesStore((s) => Object.values(s.favorites));
