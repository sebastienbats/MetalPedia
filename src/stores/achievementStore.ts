import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { TIMELINE_BADGES } from '@/lib/gamification/timeline-badges';
import { useNotificationStore } from './notificationStore';

const idbStore = createStore('metalpedia', 'achievements');

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
interface UnlockedBadge {
  id: string;
  unlockedAt: number; // timestamp
}

interface AchievementState {
  unlockedBadges: UnlockedBadge[];
  hydrated: boolean;

  unlockBadge: (id: string) => boolean; // retourne true si nouveau déblocage
  isUnlocked: (id: string) => boolean;
  getUnlockedAt: (id: string) => number | null;
  checkTimelineAchievements: (collectedIds: number[]) => void;
  setHydrated: () => void;
  resetAchievements: () => void;
}

// ═══════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════
export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlockedBadges: [],
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      unlockBadge: (id) => {
        const badge = TIMELINE_BADGES.find((b) => b.id === id);
        if (!badge) return false;

        const alreadyUnlocked = get().unlockedBadges.some((b) => b.id === id);
        if (alreadyUnlocked) return false;

        const newUnlocked: UnlockedBadge = { id, unlockedAt: Date.now() };

        set((state) => ({
          unlockedBadges: [...state.unlockedBadges, newUnlocked],
        }));

        // 🎖️ Notification toast
        useNotificationStore.getState().pushNotification({
          type: 'badge',
          rarity: badge.rarity,
          icon: badge.icon,
          title: `${badge.title} débloqué !`,
          description: badge.description,
          duration: 6000,
        });

        return true;
      },

      isUnlocked: (id) => get().unlockedBadges.some((b) => b.id === id),

      getUnlockedAt: (id) => {
        const badge = get().unlockedBadges.find((b) => b.id === id);
        return badge ? badge.unlockedAt : null;
      },

      checkTimelineAchievements: (collectedIds) => {
        // Itère sur tous les badges et débloque ceux dont la condition est remplie
        for (const badge of TIMELINE_BADGES) {
          if (get().isUnlocked(badge.id)) continue;
          try {
            if (badge.condition(collectedIds)) {
              get().unlockBadge(badge.id);
            }
          } catch (err) {
            console.error(`Erreur vérification badge ${badge.id}:`, err);
          }
        }
      },

      resetAchievements: () => set({ unlockedBadges: [] }),
    }),
    {
      name: 'metalpedia-achievements',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          try {
            const value = await idbGet(name, idbStore);
            if (!value) return null;
            return JSON.parse(value);
          } catch {
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            await idbSet(name, JSON.stringify(value), idbStore);
          } catch (err) {
            console.error('Failed to persist achievements:', err);
          }
        },
        removeItem: async (name) => {
          try {
            await idbDel(name, idbStore);
          } catch (err) {
            console.error('Failed to remove achievements:', err);
          }
        },
      })),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      },
    }
  )
);

// ═══════════════════════════════════════════════════════════
// HOOKS SÉLECTEURS
// ═══════════════════════════════════════════════════════════
export const useUnlockedBadges = () =>
  useAchievementStore((s) => s.unlockedBadges);

export const useBadgeCount = () =>
  useAchievementStore((s) => s.unlockedBadges.length);
