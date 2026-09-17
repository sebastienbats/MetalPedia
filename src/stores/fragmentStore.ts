import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FragmentState {
  collectedIds: number[];
  collectFragment: (id: number) => boolean; // Retourne true si c'est une nouvelle collecte
  isCollected: (id: number) => boolean;
  resetProgress: () => void; // Utile pour tester ou reset le compte
}

export const useFragmentStore = create<FragmentState>()(
  persist(
    (set, get) => ({
      collectedIds: [],
      
      collectFragment: (id) => {
        const isAlreadyCollected = get().collectedIds.includes(id);
        if (!isAlreadyCollected) {
          set((state) => ({ collectedIds: [...state.collectedIds, id] }));
          return true; // Nouvelle collecte !
        }
        return false; // Déjà collecté
      },
      
      isCollected: (id) => get().collectedIds.includes(id),
      
      resetProgress: () => set({ collectedIds: [] }),
    }),
    {
      name: 'metalverse-fragments-storage', // Clé dans le localStorage
    }
  )
);
