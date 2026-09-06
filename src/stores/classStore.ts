import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import type { CharacterClass } from '@/types/api';
import { getClassLevelProgress, getClassMetadata, getClassTitle } from '@/lib/gamification/classes';

const idbStore = createStore('metalpedia', 'user-class');

interface ClassState {
  // État principal
  selectedClass: CharacterClass | null;
  classXp: number;
  hydrated: boolean;
  hydrationError: string | null;

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
}

export const useClassStore = create<ClassState>()(
  persist(
    (set, get) => ({
      selectedClass: null,
      classXp: 0,
      hydrated: false,
      hydrationError: null,

      setHydrated: () => set({ hydrated: true }),
      setHydrationError: (error) => set({ hydrationError: error }),

      selectClass: (classId) => {
        set({ selectedClass: classId, classXp: 0 });
      },

      addClassXp: (xp) => {
        set((state) => ({
          classXp: state.classXp + xp,
        }));
      },

      resetClass: () => {
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
    }),
    {
      name: 'metalpedia-user-class',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          try {
            const value = await idbGet(name, idbStore);
            return value ? JSON.parse(value) : null;
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
