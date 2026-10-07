import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/api/authApi';
import { offlineSync } from '@/lib/offline-sync';
import type { CharacterClass } from '@/types/api';
import { getClassLevelProgress, getClassMetadata, getClassTitle, ALL_CLASSES } from '@/lib/gamification/classes';

const idbStore = createStore('metalpedia-user-class', 'keyval');

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
  isLoadingCloud: boolean;
  hydrationError: string | null;

  // 🏛️ Panthéon des Anciens
  pantheon: Pantheon;

  // Actions
  loadFromCloud: () => Promise<void>;
  selectClass: (classId: CharacterClass) => Promise<void>;
  addClassXp: (xp: number, action?: string) => Promise<void>;
  resetClass: () => Promise<void>;
  _syncClassToCloud: (actionType?: string) => Promise<void>;
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

      // ✅ 1. CHARGEMENT DEPUIS LE CLOUD (Trié par dernière utilisation)
      loadFromCloud: async () => {
        const user = await getCurrentUser();
        if (!user) {
          set({ isLoadingCloud: false, hydrated: true });
          return;
        }

        set({ isLoadingCloud: true });
        try {
          // ✅ CORRECTION : On trie par chosen_at décroissant pour avoir la dernière classe utilisée en premier
          const { data, error } = await supabase
            .from('user_classes')
            .select('*')
            .eq('user_id', user.id)
            .order('chosen_at', { ascending: false });

          if (error) throw error;

          if (data && data.length > 0) {
            const newPantheon = createEmptyPantheon();
            let activeClassXp = 0;
            let activeSelectedClass: CharacterClass | null = null;

            data.forEach((row, index) => {
              const cId = row.class_id as CharacterClass;
              newPantheon[cId] = Math.max(newPantheon[cId], row.class_level);
              
              // ✅ Comme la liste est triée par date décroissante, l'élément à l'index 0 est le plus récent.
              // On l'utilise comme classe sélectionnée par défaut au chargement.
              if (index === 0) {
                activeSelectedClass = cId;
                activeClassXp = row.class_xp;
              }
            });

            set({
              selectedClass: activeSelectedClass, // ✅ Restaure la dernière classe utilisée
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

      // ✅ 2. HELPER DE SYNCHRONISATION (Double écriture + mise à jour du timestamp)
      _syncClassToCloud: async (actionType = 'xp_gain') => {
        const user = await getCurrentUser();
        const state = get();
        if (!user || !state.selectedClass) return;

        const currentLevel = getClassLevelProgress(state.classXp).currentLevel;

        if (offlineSync.isCurrentlyOnline()) {
          // A. Mettre à jour la progression globale de la classe (et la date de dernier choix)
          const { error: classError } = await supabase.from('user_classes').upsert({
            user_id: user.id,
            class_id: state.selectedClass,
            class_xp: state.classXp,
            class_level: currentLevel,
            chosen_at: new Date().toISOString(), // ✅ Force la mise à jour du timestamp pour le tri
          }, { onConflict: 'user_id,class_id' });

          if (classError) console.error('Échec sync user_classes:', classError);

          // B. Insérer un journal dans xp_history
          const { error: historyError } = await supabase.from('xp_history').insert({
            user_id: user.id,
            action: actionType,
            amount: state.classXp,
            description: `XP gagné pour la classe ${state.selectedClass}`,
          });

          if (historyError) console.error('Échec sync xp_history:', historyError);
        } else {
          offlineSync.addPendingOperation({
            type: 'class_sync',
            payload: { 
              classId: state.selectedClass, 
              xp: state.classXp, 
              level: currentLevel,
              action: actionType 
            },
          });
        }
      },

      // ✅ 3. ACTIONS AVEC MISE À JOUR OPTIMISTE
      selectClass: async (classId) => {
        set({ selectedClass: classId, classXp: 0 });
        await get()._syncClassToCloud('class_selected');
      },

      addClassXp: async (xp, action = 'xp_gain') => {
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
        
        await get()._syncClassToCloud(action);
      },

      resetClass: async () => {
        set({ selectedClass: null, classXp: 0 });
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
          // 🛡️ SSR Guard
          if (typeof window === 'undefined') return null;
          try {
            const value = await idbGet(name, idbStore);
            if (!value) return null;
            
            const parsed = JSON.parse(value);
            
            // 🛡️ VÉRIFICATION ROBUSTE ULTIME : Empêche le crash "Cannot read properties of undefined"
            if (parsed && parsed.state) {
              if (!parsed.state.pantheon) {
                parsed.state.pantheon = createEmptyPantheon();
              }
              return parsed;
            }
            
            // Si la structure est corrompue, on retourne null pour forcer une réinitialisation propre
            return null;
          } catch (error) {
            console.error('Failed to read class from IndexedDB:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          // 🛡️ SSR Guard
          if (typeof window === 'undefined') return;
          try {
            await idbSet(name, JSON.stringify(value), idbStore);
          } catch (err: any) {
            // Ignore silencieusement les erreurs de structure corrompue (NotFoundError)
            if (err?.name !== 'NotFoundError') {
              console.error('Failed to persist class:', err);
            }
          }
        },
        removeItem: async (name) => {
          // 🛡️ SSR Guard
          if (typeof window === 'undefined') return;
          try {
            await idbDel(name, idbStore);
          } catch (err: any) {
            if (err?.name !== 'NotFoundError') {
              console.error('Failed to remove class:', err);
            }
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
