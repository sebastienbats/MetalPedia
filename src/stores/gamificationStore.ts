import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStore, set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import {
  PlayerStats,
  XPEvent,
  calculateXP,
  checkBadgeUnlocked,
  checkQuestCompleted,
  getLevelProgress,
  createXPEvent,
} from '@/lib/gamification/engine';
import { BADGES } from '@/lib/gamification/badges';
import { QUESTS } from '@/lib/gamification/quests';
import { getLevelFromXP } from '@/lib/gamification/lore';

// ═══════════════════════════════════════════════════════════
// CONFIGURATION INDEXEDDB
// ═══════════════════════════════════════════════════════════
const idbStore = createStore('metalpedia', 'gamification');

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface GamificationState {
  stats: PlayerStats;
  xpHistory: XPEvent[];
  showLevelUpModal: boolean;
  pendingLevelUp: number | null;

  // Actions
  recordView: (band: { id: number; name: string; genre: string; country: string }) => void;
  recordFavorite: (bandId: number, isAdding: boolean) => void;
  recordReview: () => void;
  recordGenreDiscovery: (genre: string) => void;
  claimDailyBonus: () => void;
  completeQuest: (questId: string) => void;

  // Getters
  getLevelProgress: () => ReturnType<typeof getLevelProgress>;
  getUnlockedBadges: () => typeof BADGES;
  getActiveQuests: () => typeof QUESTS;
  getCompletedQuests: () => typeof QUESTS;

  // UI
  closeLevelUpModal: () => void;
}

// ═══════════════════════════════════════════════════════════
// ÉTAT INITIAL
// ═══════════════════════════════════════════════════════════

const initialStats: PlayerStats = {
  totalViews: 0,
  totalFavorites: 0,
  totalReviews: 0,
  genresExplored: [],
  questsCompleted: [],
  badgesUnlocked: [],
  totalXP: 0,
  level: 1,
  lastDailyBonus: null,
};

// ═══════════════════════════════════════════════════════════
// STORE ZUSTAND
// ═══════════════════════════════════════════════════════════

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      stats: initialStats,
      xpHistory: [],
      showLevelUpModal: false,
      pendingLevelUp: null,

      recordView: (band) => {
        const xp = calculateXP('VIEW_BAND');
        const event = createXPEvent('VIEW_BAND', band.name);

        set((state) => {
          const newXP = state.stats.totalXP + xp;
          const newLevel = getLevelFromXP(newXP);
          const oldLevel = state.stats.level;

          const newGenres = state.stats.genresExplored.includes(band.genre)
            ? state.stats.genresExplored
            : [...state.stats.genresExplored, band.genre];

          const newStats: PlayerStats = {
            ...state.stats,
            totalViews: state.stats.totalViews + 1,
            genresExplored: newGenres,
            totalXP: newXP,
            level: newLevel,
          };

          const newBadges = BADGES.filter(
            (b) => !newStats.badgesUnlocked.includes(b.id) && checkBadgeUnlocked(b, newStats)
          ).map((b) => b.id);

          if (newBadges.length > 0) {
            newStats.badgesUnlocked = [...newStats.badgesUnlocked, ...newBadges];
          }

          return {
            stats: newStats,
            xpHistory: [event, ...state.xpHistory].slice(0, 100),
            showLevelUpModal: newLevel > oldLevel,
            pendingLevelUp: newLevel > oldLevel ? newLevel : null,
          };
        });
      },

      recordFavorite: (bandId, isAdding) => {
        const action = isAdding ? 'ADD_FAVORITE' : 'REMOVE_FAVORITE';
        const xp = calculateXP(action);

        set((state) => {
          const newXP = Math.max(0, state.stats.totalXP + xp);
          const newLevel = getLevelFromXP(newXP);
          const oldLevel = state.stats.level;

          const newStats: PlayerStats = {
            ...state.stats,
            totalFavorites: isAdding
              ? state.stats.totalFavorites + 1
              : Math.max(0, state.stats.totalFavorites - 1),
            totalXP: newXP,
            level: newLevel,
          };

          return {
            stats: newStats,
            showLevelUpModal: newLevel > oldLevel,
            pendingLevelUp: newLevel > oldLevel ? newLevel : null,
          };
        });
      },

      recordReview: () => {
        const xp = calculateXP('WRITE_REVIEW');
        const event = createXPEvent('WRITE_REVIEW');

        set((state) => {
          const newXP = state.stats.totalXP + xp;
          const newLevel = getLevelFromXP(newXP);
          const oldLevel = state.stats.level;

          const newStats: PlayerStats = {
            ...state.stats,
            totalReviews: state.stats.totalReviews + 1,
            totalXP: newXP,
            level: newLevel,
          };

          const completedQuests = QUESTS.filter(
            (q) =>
              !newStats.questsCompleted.includes(q.id) &&
              checkQuestCompleted(q, newStats)
          );

          if (completedQuests.length > 0) {
            const questXP = completedQuests.reduce((sum, q) => sum + q.xpReward, 0);
            newStats.totalXP += questXP;
            newStats.questsCompleted = [
              ...newStats.questsCompleted,
              ...completedQuests.map((q) => q.id),
            ];
          }

          return {
            stats: newStats,
            xpHistory: [event, ...state.xpHistory].slice(0, 100),
            showLevelUpModal: newLevel > oldLevel,
            pendingLevelUp: newLevel > oldLevel ? newLevel : null,
          };
        });
      },

      recordGenreDiscovery: (genre) => {
        set((state) => {
          if (state.stats.genresExplored.includes(genre)) return state;

          const xp = calculateXP('DISCOVER_NEW_GENRE');
          const event = createXPEvent('DISCOVER_NEW_GENRE', genre);

          const newStats: PlayerStats = {
            ...state.stats,
            genresExplored: [...state.stats.genresExplored, genre],
            totalXP: state.stats.totalXP + xp,
          };

          return {
            stats: newStats,
            xpHistory: [event, ...state.xpHistory].slice(0, 100),
          };
        });
      },

      claimDailyBonus: () => {
        const today = new Date().toDateString();
        const state = get();

        if (state.stats.lastDailyBonus === today) return;

        const xp = calculateXP('DAILY_LOGIN');
        const event = createXPEvent('DAILY_LOGIN');

        set((state) => ({
          stats: {
            ...state.stats,
            totalXP: state.stats.totalXP + xp,
            lastDailyBonus: today,
          },
          xpHistory: [event, ...state.xpHistory].slice(0, 100),
        }));
      },

      completeQuest: (questId) => {
        const quest = QUESTS.find((q) => q.id === questId);
        if (!quest) return;

        set((state) => {
          if (state.stats.questsCompleted.includes(questId)) return state;

          const newStats: PlayerStats = {
            ...state.stats,
            questsCompleted: [...state.stats.questsCompleted, questId],
            totalXP: state.stats.totalXP + quest.xpReward,
          };

          return { stats: newStats };
        });
      },

      getLevelProgress: () => {
        const state = get();
        return getLevelProgress(state.stats.totalXP);
      },

      getUnlockedBadges: () => {
        const state = get();
        return BADGES.filter((b) => state.stats.badgesUnlocked.includes(b.id));
      },

      getActiveQuests: () => {
        const state = get();
        return QUESTS.filter((q) => !state.stats.questsCompleted.includes(q.id));
      },

      getCompletedQuests: () => {
        const state = get();
        return QUESTS.filter((q) => state.stats.questsCompleted.includes(q.id));
      },

      closeLevelUpModal: () => {
        set({ showLevelUpModal: false, pendingLevelUp: null });
      },
    }),
    {
      name: 'metalpedia-gamification',
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
            console.error('Failed to persist gamification:', err);
          }
        },
        // ✅ AJOUT : removeItem est requis par l'interface StateStorage de Zustand
        removeItem: async (name) => {
          try {
            await idbDel(name, idbStore);
          } catch (err) {
            console.error('Failed to remove gamification:', err);
          }
        },
      })),
    }
  )
);

// ═══════════════════════════════════════════════════════════
// SÉLECTEURS OPTIMISÉS
// ═══════════════════════════════════════════════════════════

export const usePlayerLevel = () => useGamificationStore((s) => s.stats.level);
export const usePlayerXP = () => useGamificationStore((s) => s.stats.totalXP);
