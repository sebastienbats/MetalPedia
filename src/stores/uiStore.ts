import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'forge' | 'cathedral' | 'hellfire' | 'frost';

interface UIState {
  theme: Theme;
  commandPaletteOpen: boolean;
  setTheme: (theme: Theme) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'forge',
      commandPaletteOpen: false,

      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
    }),
    { name: 'metalpedia-ui' }
  )
);
