import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/api/authApi'; // ✅ Utilitaire d'authentification hors React
import { offlineSync } from '@/lib/offline-sync';
import { useGamificationStore } from './gamificationStore';
import type { BandSearchResult } from '@/types/api';

const idbStore = createStore('metalpedia', 'favorites');

interface FavoritesState {
  favorites: Record<number, BandSearchResult>;
  hydrated: boolean;
  isLoadingCloud: boolean; // ✅ Nouveau : pour gérer l'état de chargement depuis le cloud
  hydrationError: string | null;

  // Actions
  loadFromCloud: () => Promise<void>; // ✅ Nouveau : charge les favoris depuis Supabase
  add: (band: BandSearchResult) => Promise<void>;
  remove: (id: number) => Promise<void>;
  toggle: (band: BandSearchResult) => Promise<void>;
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
      isLoadingCloud: false,
      hydrationError: null,

      setHydrated: () => set({ hydrated: true }),
      setHydrationError: (error) => set({ hydrationError: error }),

      // ✅ 1. CHARGEMENT DEPUIS LE CLOUD
      loadFromCloud: async () => {
        const user = await getCurrentUser();
        if (!user) {
          set({ hydrated: true, isLoadingCloud: false });
          return;
        }

        set({ isLoadingCloud: true });
        try {
          // Étape A : Récupérer les ID des groupes favoris
          const { data: favs, error: favError } = await supabase
            .from('user_favorites')
            .select('band_id')
            .eq('user_id', user.id);

          if (favError) throw favError;

          if (favs && favs.length > 0) {
            const bandIds = favs.map((f) => f.band_id);

            // Étape B : Récupérer les détails des groupes (Requête optimisée)
            const { data: bands, error: bandError } = await supabase
              .from('bands')
              .select('id, name, genre, country, genre_pillar, formed, status, image_url')
              .in('id', bandIds);

            if (bandError) throw bandError;

            if (bands) {
              const favMap = bands.reduce((acc, band) => {
                acc[band.id] = band as BandSearchResult;
                return acc;
              }, {} as Record<number, BandSearchResult>);

              // Fusion avec l'existant (pour préserver les ajouts hors ligne non encore sync)
              set((state) => ({
                favorites: { ...state.favorites, ...favMap },
              }));
            }
          } else {
            // Pas de favoris en base, on vide le state local pour être synchronisé
            set({ favorites: {} });
          }
        } catch (error) {
          console.error('Erreur chargement favoris cloud:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          set({ hydrationError: errorMessage });
        } finally {
          set({ isLoadingCloud: false, hydrated: true });
        }
      },

      // ✅ 2. AJOUT AVEC MISE À JOUR OPTIMISTE + SYNC CLOUD
      add: async (band) => {
        // A. Mise à jour immédiate de l'UI (Optimistic)
        set((state) => ({
          favorites: { ...state.favorites, [band.id]: band },
        }));

        useGamificationStore.getState().recordFavorite(band.id, true);

        // B. Synchronisation
        const user = await getCurrentUser();
        if (user) {
          if (offlineSync.isCurrentlyOnline()) {
            // Upsert pour éviter les erreurs de contrainte unique si l'utilisateur clique vite
            await supabase.from('user_favorites').upsert(
              {
                user_id: user.id,
                band_id: band.id,
              },
              { onConflict: 'user_id,band_id' }
            );
          } else {
            offlineSync.addPendingOperation({
              type: 'favorite_add',
              payload: { band_id: band.id, name: band.name },
            });
          }
        }
        // Si pas connecté, Zustand persiste automatiquement dans IndexedDB (comportement par défaut)
      },

      // ✅ 3. SUPPRESSION AVEC MISE À JOUR OPTIMISTE + SYNC CLOUD
      remove: async (id) => {
        // A. Mise à jour immédiate de l'UI (Optimistic)
        set((state) => {
          const { [id]: _, ...rest } = state.favorites;
          return { favorites: rest };
        });

        useGamificationStore.getState().recordFavorite(id, false);

        // B. Synchronisation
        const user = await getCurrentUser();
        if (user) {
          if (offlineSync.isCurrentlyOnline()) {
            await supabase
              .from('user_favorites')
              .delete()
              .match({ user_id: user.id, band_id: id });
          } else {
            offlineSync.addPendingOperation({
              type: 'favorite_remove',
              payload: { band_id: id },
            });
          }
        }
      },

      toggle: async (band) => {
        const { favorites } = get();
        if (favorites[band.id]) {
          await get().remove(band.id);
        } else {
          await get().add(band);
        }
      },

      isFavorite: (id) => !!get().favorites[id],
      clearAll: () => set({ favorites: {} }),

      // ✅ 4. DÉCLENCHEUR DE SYNCHRONISATION MANUELLE (pour les opérations hors ligne)
      syncToCloud: async () => {
        console.log('🔄 Synchronisation des favoris en attente...');
        if (offlineSync.processQueue) {
          await offlineSync.processQueue();
        }
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
            const errorMessage = error instanceof Error ? error.message : String(error);
            state?.setHydrationError(errorMessage);
          } else if (state) {
            state.setHydrated();
            // 🚀 Optionnel : Décommente la ligne suivante si tu veux charger le cloud automatiquement au démarrage
            // state.loadFromCloud();
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

export const useFavoritesIsLoadingCloud = () =>
  useFavoritesStore((s) => s.isLoadingCloud);

// ═══════════════════════════════════════════════════════════
// HOOKS PERSONNALISÉS AVANCÉS
// ═══════════════════════════════════════════════════════════

export function useFavoritesHydration() {
  const hydrated = useFavoritesStore((s) => s.hydrated);
  const isLoadingCloud = useFavoritesStore((s) => s.isLoadingCloud);
  const error = useFavoritesStore((s) => s.hydrationError);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsFirstRender(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return {
    isHydrated: hydrated,
    isLoading: isLoadingCloud || (!hydrated && isFirstRender),
    error,
  };
}

export function useFavoritesWhenReady(): BandSearchResult[] {
  const { isHydrated, isLoading } = useFavoritesHydration();
  const favorites = useFavoriteBands();

  // On attend que l'hydratation locale ET le chargement cloud soient terminés
  if (!isHydrated || isLoading) return [];
  return favorites;
}
