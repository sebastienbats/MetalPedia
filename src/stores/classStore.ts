import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/api/authApi';
import { offlineSync } from '@/lib/offline-sync';
import type { CharacterClass } from '@/types/api';
import { getClassLevelProgress, getClassMetadata, getClassTitle, ALL_CLASSES } from '@/lib/gamification/classes';

const idbStore = createStore('metalpedia', 'user-class');

// ═══════════════════════════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Le Panthéon enregistre le niveau MAX atteint pour chaque classe.
 * Il n'est JAMAIS réinitialisé, même lors d'un changement de classe.
 */
type Pantheon = Record<CharacterClass, number>;

const createEmptyPantheon = (): Pantheon => {
  const pantheon = {} as Pantheon;
  ALL_CLASSES.forEach((c) => {
    pantheon[c.id] = 0;
  });
  return pantheon;
};

interface ClassState {
  // État principal
  selectedClass: CharacterClass | null;
  classXp: number;
  hydrated: boolean;
  isLoadingCloud: boolean; // ✅ NOUVEAU
  hydrationError: string | null;

  // 🏛️ Panthéon des Anciens
  pantheon: Pantheon;

  // Actions
  loadFromCloud: () => Promise<void>; // ✅ NOUVEAU
  selectClass: (classId: CharacterClass) => Promise<void>;
  addClassXp: (xp: number) => Promise<void>;
  resetClass: () => Promise<void>;
  _syncClassToCloud: () => Promise<void>; // ✅ NOUVEAU (Helper interne)
  setHydrated: () => void;
  setHydrationError: (error: string | null) => void;

  // Getters
  hasClass: () => boolean;
  getCurrentTitle: () => string | null;
  getClassProgress: () => ReturnType<typeof getClassLevelProgress> | null;
  getClassMeta: () => ReturnType<typeof getClassMetadata> | null;
  getPantheonLevel: (classId: CharacterClass) => number;
}

export const useClassStore = create<ClassState>()(
  persist(
    (set, get) => ({
      selectedClass: null,
      classXp: 0,
      hydrated: false,
      isLoadingCloud: false,
      hydrationError: null,
      pantheon: createEmptyPantheon(),

      setHydrated: () => set({ hydrated: true }),
      setHydrationError: (error) => set({ hydrationError: error }),

      // ✅ 1. CHARGEMENT DEPUIS LE CLOUD
      loadFromCloud: async () => {
        const user = await getCurrentUser();
        if (!user) {
          set({ isLoadingCloud: false, hydrated: true });
          return;
        }

        set({ isLoadingCloud: true });
        try {
          // On récupère TOUTES les classes de l'utilisateur pour reconstruire le Panthéon
          const { data, error } = await supabase
            .from('user_classes')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;

          if (data && data.length > 0) {
            const newPantheon = createEmptyPantheon();
            const currentState = get();
            let activeClassXp = currentState.classXp;

            // Reconstruction du Panthéon et récupération de l'XP de la classe active
            data.forEach((row) => {
              const cId = row.class_id as CharacterClass;
              newPantheon[cId] = Math.max(newPantheon[cId], row.class_level);
              
              // Si cette ligne correspond à la classe actuellement sélectionnée en local, on sync son XP
              if (currentState.selectedClass && cId === currentState.selectedClass) {
                activeClassXp = row.class_xp;
              }
            });

            set({
              pantheon: newPantheon,
              classXp: activeClassXp,
              isLoadingCloud: false,
              hydrated: true,
            });
          } else {
            set({ isLoadingCloud: false, hydrated: true });
          }
        } catch (error) {
          console.error('Erreur chargement classe cloud:', error);
          set({ 
            hydrationError: error instanceof Error ? error.message : String(error),
            isLoadingCloud: false,
            hydrated: true 
          });
        }
      },

      // ✅ 2. HELPER DE SYNCHRONISATION
      _syncClassToCloud: async () => {
        const user = await getCurrentUser();
        const state = get();
        if (!user || !state.selectedClass) return;

        const currentLevel = getClassLevelProgress(state.classXp).currentLevel;

        if (offlineSync.isCurrentlyOnline()) {
          const { error } = await supabase.from('user_classes').upsert({
            user_id: user.id,
            class_id: state.selectedClass,
            class_xp: state.classXp,
            class_level: currentLevel,
            // Note: chosen_at n'est pas mis à jour ici pour préserver la date de choix initiale 
          }, { onConflict: 'user_id,class_id' });

          if (error) console.error('Échec sync classe:', error);
        } else {
          offlineSync.addPendingOperation({
            type: 'class_sync',
            payload: { classId: state.selectedClass, xp: state.classXp, level: currentLevel },
          });
        }
      },

      // ✅ 3. ACTIONS AVEC MISE À JOUR OPTIMISTE
      selectClass: async (classId) => {
        // Mise à jour locale immédiate
        set({ selectedClass: classId, classXp: 0 });
        // Synchronisation en arrière-plan
        await get()._syncClassToCloud();
      },

      addClassXp: async (xp) => {
        // Mise à jour locale immédiate (avec logique Panthéon)
        set((state) => {
          const newClassXp = state.classXp + xp;
          const selectedClass = state.selectedClass;
          let newPantheon = state.pantheon;

          if (selectedClass) {
            const newLevel = getClassLevelProgress(newClassXp).currentLevel;
            const currentMax = state.pantheon[selectedClass];
            
            if (newLevel > currentMax) {
              newPantheon = { ...state.pantheon, [selectedClass]: newLevel };
            }
          }

          return { classXp: newClassXp, pantheon: newPantheon };
        });
        
        // Synchronisation en arrière-plan
        await get()._syncClassToCloud();
      },

      resetClass: async () => {
        set({ selectedClass: null, classXp: 0 });
        // Pas de sync nécessaire ici, car selectedClass est null
      },

      hasClass: () => !!get().selectedClass,

      getCurrentTitle: () => {
        const { selectedClass, classXp } = get();
        if (!selectedClass) return null;
        const progress = getClassLevelProgress(classXp);
        return getClassTitle(selectedClass, progress.currentLevel);
      },

      getClassProgress: () => {
        const { selectedClass, classXp } = get();
        if (!selectedClass) return null;
        return getClassLevelProgress(classXp);
      },

      getClassMeta: () => {
        const { selectedClass } = get();
        if (!selectedClass) return null;
        return getClassMetadata(selectedClass);
      },

      getPantheonLevel: (classId) => {
        return get().pantheon[classId] || 0;
      },
    }),
    {
      name: 'metalpedia-user-class',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          // 🛡️ SSR Guard : Si on est sur le serveur, on ne touche pas à IndexedDB
          if (typeof window === 'undefined') return null;
          try {
            const value = await idbGet(name, idbStore);
            if (!value) return null;
            
            const parsed = JSON.parse(value);
            
            // 🛡️ Migration : s'assurer que le panthéon existe pour les anciens utilisateurs
            if (!parsed.state.pantheon) {
              parsed.state.pantheon = createEmptyPantheon();
            }
            
            return parsed;
          } catch (error) {
            console.error('Failed to read class from IndexedDB:', error);
            return null; // ✅ Retourne null au lieu de throw pour éviter le crash SSR
          }
        },
        setItem: async (name, value) => {
          // 🛡️ SSR Guard
          if (typeof window === 'undefined') return;
          try {
            await idbSet(name, JSON.stringify(value), idbStore);
          } catch (err) {
            console.error('Failed to persist class:', err);
          }
        },
        removeItem: async (name) => {
          // 🛡️ SSR Guard
          if (typeof window === 'undefined') return;
          try {
            await idbDel(name, idbStore);
          } catch (err) {
            console.error('Failed to remove class:', err);
          }
        },
      })),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Class hydration error:', error);
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
// HOOKS SÉLECTEURS
// ═══════════════════════════════════════════════════════════

export const useSelectedClass = () => useClassStore((s) => s.selectedClass);
export const useClassXp = () => useClassStore((s) => s.classXp);
export const useClassHydrated = () => useClassStore((s) => s.hydrated);
export const useClassIsLoadingCloud = () => useClassStore((s) => s.isLoadingCloud);

export const useClassProgress = () =>
  useClassStore((s) => {
    if (!s.selectedClass) return null;
    return getClassLevelProgress(s.classXp);
  });

export const useClassMetadata = () =>
  useClassStore((s) => {
    if (!s.selectedClass) return null;
    return getClassMetadata(s.selectedClass);
  });

export const usePantheon = () => useClassStore((s) => s.pantheon);
export const usePantheonLevel = (classId: CharacterClass) =>
  useClassStore((s) => s.pantheon[classId] || 0);
