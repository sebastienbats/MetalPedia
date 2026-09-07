import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
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
  hydrationError: string | null;

  // 🏛️ Panthéon des Anciens
  pantheon: Pantheon;

  // Actions
  selectClass: (classId: CharacterClass) => void;
  addClassXp: (xp: number) => void;
  resetClass: () => void;
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
      hydrationError: null,
      pantheon: createEmptyPantheon(), // 🆕 Initialisation du Panthéon

      setHydrated: () => set({ hydrated: true }),
      setHydrationError: (error) => set({ hydrationError: error }),

      selectClass: (classId) => {
        // 🛡️ IMPORTANT : On NE réinitialise PAS le panthéon lors du changement de classe.
        // Seul l'XP de la classe active est réinitialisé.
        set({ selectedClass: classId, classXp: 0 });
      },

      addClassXp: (xp) => {
        const state = get();
        const newClassXp = state.classXp + xp;
        const selectedClass = state.selectedClass;

        // 🏛️ Mise à jour du Panthéon si nouveau record de niveau
        let newPantheon = state.pantheon;
        if (selectedClass) {
          const newLevel = getClassLevelProgress(newClassXp).currentLevel;
          const currentMax = state.pantheon[selectedClass];
          
          if (newLevel > currentMax) {
            newPantheon = {
              ...state.pantheon,
              [selectedClass]: newLevel,
            };
          }
        }

        set({
          classXp: newClassXp,
          pantheon: newPantheon,
        });
      },

      resetClass: () => {
        // 🛡️ resetClass NE touche PAS au panthéon
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
            throw error;
          }
        },
        setItem: async (name, value) => {
          try {
            await idbSet(name, JSON.stringify(value), idbStore);
          } catch (err) {
            console.error('Failed to persist class:', err);
          }
        },
        removeItem: async (name) => {
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

export const useSelectedClass = () =>
  useClassStore((s) => s.selectedClass);

export const useClassXp = () =>
  useClassStore((s) => s.classXp);

export const useClassHydrated = () =>
  useClassStore((s) => s.hydrated);

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

// 🏛️ Hook pour accéder au Panthéon complet
export const usePantheon = () =>
  useClassStore((s) => s.pantheon);

// 🏛️ Hook pour accéder au niveau max d'une classe spécifique
export const usePantheonLevel = (classId: CharacterClass) =>
  useClassStore((s) => s.pantheon[classId] || 0);
