import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import type { BandSearchResult } from '@/types/api';
import { offlineSync } from '@/lib/offline-sync';

const idbStore = createStore('metalpedia', 'favorites');

interface FavoritesState {
  favorites: Record<number, BandSearchResult>;
  add: (band: BandSearchResult) => void;
  remove: (id: number) => void;
  toggle: (band: BandSearchResult) => void;
  isFavorite: (id: number) => boolean;
  clearAll: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: {},

      add: (band) => {
        set((state) => ({
          favorites: { ...state.favorites, [band.id]: band },
        }));
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
        if (!offlineSync.isCurrentlyOnline()) {
          offlineSync.addPendingOperation({
            type: 'favorite_remove',
            payload: { band_id: id },
          });
        }
      },

      toggle: (band) => {
        const { favorites } = get();
        if (favorites[band.id]) get().remove(band.id);
        else get().add(band);
      },

      isFavorite: (id) => !!get().favorites[id],
      clearAll: () => set({ favorites: {} }),
    }),
    {
      name: 'metalpedia-favorites',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const value = await idbGet(name, idbStore);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await idbSet(name, JSON.stringify(value), idbStore);
        },
        removeItem: async (name) => {
          await idbDel(name, idbStore);
        },
      })),
    }
  )
);
