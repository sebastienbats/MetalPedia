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
  normalizeGenreForGamification,
} from '@/lib/gamification/engine';
import { BADGES } from '@/lib/gamification/badges';
import { QUESTS } from '@/lib/gamification/quests';
import { getLevelFromXP } from '@/lib/gamification/lore';
import { useClassStore } from './classStore';
import { getClassMetadata } from '@/lib/gamification/classes';

const idbStore = createStore('metalpedia', 'gamification');

// ═══════════════════════════════════════════════════════════
// SYSTÈME DE BONUS DE CLASSE
// ═══════════════════════════════════════════════════════════

/**
 * Calcule l'XP final après application du bonus de classe.
 */
function applyClassBonus(
  baseXp: number,
  actionType: 'view' | 'favorite' | 'review' | 'explore' | 'quest' | 'quiz' | 'daily',
  context?: { band?: {
    listeners?: number | null;
    formed?: number | null;
    status?: string | null;
    biography?: string | null;
  } }
): { finalXp: number; bonusApplied: boolean; multiplier: number } {
  const selectedClass = useClassStore.getState().selectedClass;
  if (!selectedClass) {
    return { finalXp: baseXp, bonusApplied: false, multiplier: 1 };
  }

  const classMeta = getClassMetadata(selectedClass);
  const bonus = classMeta.bonus;

  let isEligible = false;

  // On évalue le TYPE de bonus de la classe
  switch (bonus.type) {
    case 'all':
      // Le bonus 'all' s'applique à TOUTES les actions, y compris 'daily'
      isEligible = true;
      break;
    case 'low_listeners':
      isEligible = !!(
        actionType === 'view' && 
        context?.band && 
        typeof context.band.listeners === 'number' &&
        context.band.listeners < (bonus.threshold || 1000)
      );
      break;
    case 'reviews':
      isEligible = actionType === 'review';
      break;
    case 'vintage':
      isEligible = !!(
        actionType === 'view' && 
        context?.band && 
        typeof context.band.formed === 'number' &&
        context.band.formed < (bonus.threshold || 1990)
      );
      break;
    case 'favorites':
      isEligible = actionType === 'favorite';
      break;
    case 'active_bands':
      isEligible = !!(
        actionType === 'view' && 
        context?.band && 
        context.band.status === 'Active'
      );
      break;
    case 'biography':
      isEligible = !!(
        actionType === 'view' && 
        context?.band && 
        typeof context.band.biography === 'string' && 
        context.band.biography.split(/\s+/).length > (bonus.threshold || 500)
      );
      break;
    case 'quiz':
      isEligible = actionType === 'quiz';
      break;
    case 'rare_country':
      isEligible = false; // À implémenter plus tard avec une liste de pays rares
      break;
  }

  if (!isEligible) {
    return { finalXp: baseXp, bonusApplied: false, multiplier: 1 };
  }

  const finalXp = Math.round(baseXp * bonus.multiplier);
  return { finalXp, bonusApplied: true, multiplier: bonus.multiplier };
}

// ═══════════════════════════════════════════════════════════
// ÉTAT ET ACTIONS DU STORE
// ═══════════════════════════════════════════════════════════

interface GamificationState {
  stats: PlayerStats;
  xpHistory: XPEvent[];
  showLevelUpModal: boolean;
  pendingLevelUp: number | null;

  recordView: (band: { 
    id: number; 
    name: string; 
    genre: string; 
    genre_pillar?: string | null; 
    country: string;
    listeners?: number | null;
    formed?: number | null;
    status?: string | null;
    biography?: string | null;
  }) => void;
  recordFavorite: (bandId: number, isAdding: boolean) => void;
  recordReview: () => void;
  recordGenreDiscovery: (genre: string) => void;
  claimDailyBonus: () => void;
  completeQuest: (questId: string) => void;

  getLevelProgress: () => ReturnType<typeof getLevelProgress>;
  getUnlockedBadges: () => typeof BADGES;
  getActiveQuests: () => typeof QUESTS;
  getCompletedQuests: () => typeof QUESTS;
  closeLevelUpModal: () => void;
}

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

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      stats: initialStats,
      xpHistory: [],
      showLevelUpModal: false,
      pendingLevelUp: null,

      recordView: (band) => {
        const baseXp = calculateXP('VIEW_BAND');
        const { finalXp, bonusApplied } = applyClassBonus(baseXp, 'view', { band });
        const event = createXPEvent('VIEW_BAND', band.name);

        const gamificationGenre = normalizeGenreForGamification(band.genre, band.genre_pillar);

        set((state) => {
          const newXP = state.stats.totalXP + finalXp;
          const newLevel = getLevelFromXP(newXP);
          const oldLevel = state.stats.level;

          const newGenres = state.stats.genresExplored.includes(gamificationGenre)
            ? state.stats.genresExplored
            : [...state.stats.genresExplored, gamificationGenre];

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

          // 🎯 Bonus de classe : on ajoute aussi de l'XP à la classe elle-même
          if (bonusApplied) {
            const selectedClass = useClassStore.getState().selectedClass;
            if (selectedClass) {
              const classMeta = getClassMetadata(selectedClass);
              const classBonusXp = Math.round(5 * (classMeta.bonus.multiplier - 1));
              useClassStore.getState().addClassXp(classBonusXp);
            }
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
        const baseXp = calculateXP(action);
        const { finalXp, bonusApplied } = applyClassBonus(baseXp, 'favorite');

        set((state) => {
          const newXP = Math.max(0, state.stats.totalXP + finalXp);
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

          if (isAdding && bonusApplied) {
            const selectedClass = useClassStore.getState().selectedClass;
            if (selectedClass) {
              const classMeta = getClassMetadata(selectedClass);
              const classBonusXp = Math.round(5 * (classMeta.bonus.multiplier - 1));
              useClassStore.getState().addClassXp(classBonusXp);
            }
          }

          return {
            stats: newStats,
            showLevelUpModal: newLevel > oldLevel,
            pendingLevelUp: newLevel > oldLevel ? newLevel : null,
          };
        });
      },

      recordReview: () => {
        const baseXp = calculateXP('WRITE_REVIEW');
        const { finalXp, bonusApplied } = applyClassBonus(baseXp, 'review');
        const event = createXPEvent('WRITE_REVIEW');

        set((state) => {
          const newXP = state.stats.totalXP + finalXp;
          const newLevel = getLevelFromXP(newXP);
          const oldLevel = state.stats.level;

          const newStats: PlayerStats = {
            ...state.stats,
            totalReviews: state.stats.totalReviews + 1,
            totalXP: newXP,
            level: newLevel,
          };

          const completedQuests = QUESTS.filter(
            (q) => !newStats.questsCompleted.includes(q.id) && checkQuestCompleted(q, newStats)
          );

          if (completedQuests.length > 0) {
            const questXP = completedQuests.reduce((sum, q) => sum + q.xpReward, 0);
            newStats.totalXP += questXP;
            newStats.questsCompleted = [
              ...newStats.questsCompleted,
              ...completedQuests.map((q) => q.id),
            ];
          }

          if (bonusApplied) {
            const selectedClass = useClassStore.getState().selectedClass;
            if (selectedClass) {
              const classMeta = getClassMetadata(selectedClass);
              const classBonusXp = Math.round(5 * (classMeta.bonus.multiplier - 1));
              useClassStore.getState().addClassXp(classBonusXp);
            }
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
        const gamificationGenre = normalizeGenreForGamification(genre);

        set((state) => {
          if (state.stats.genresExplored.includes(gamificationGenre)) return state;

          const baseXp = calculateXP('DISCOVER_NEW_GENRE');
          const { finalXp } = applyClassBonus(baseXp, 'explore');
          const event = createXPEvent('DISCOVER_NEW_GENRE', gamificationGenre);

          const newStats: PlayerStats = {
            ...state.stats,
            genresExplored: [...state.stats.genresExplored, gamificationGenre],
            totalXP: state.stats.totalXP + finalXp,
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

        const baseXp = calculateXP('DAILY_LOGIN');
        // Passe 'daily' comme actionType. Si la classe a le bonus 'all', isEligible sera true.
        const { finalXp } = applyClassBonus(baseXp, 'daily');
        const event = createXPEvent('DAILY_LOGIN');

        set((state) => ({
          stats: {
            ...state.stats,
            totalXP: state.stats.totalXP + finalXp,
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

      getLevelProgress: () => getLevelProgress(get().stats.totalXP),
      getUnlockedBadges: () => BADGES.filter((b) => get().stats.badgesUnlocked.includes(b.id)),
      getActiveQuests: () => QUESTS.filter((q) => !get().stats.questsCompleted.includes(q.id)),
      getCompletedQuests: () => QUESTS.filter((q) => get().stats.questsCompleted.includes(q.id)),
      closeLevelUpModal: () => set({ showLevelUpModal: false, pendingLevelUp: null }),
    }),
    {
      name: 'metalpedia-gamification',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          try {
            const value = await idbGet(name, idbStore);
            return value ? JSON.parse(value) : null;
          } catch { return null; }
        },
        setItem: async (name, value) => {
          try { await idbSet(name, JSON.stringify(value), idbStore); }
          catch (err) { console.error('Failed to persist gamification:', err); }
        },
        removeItem: async (name) => {
          try { await idbDel(name, idbStore); }
          catch (err) { console.error('Failed to remove gamification:', err); }
        },
      })),
    }
  )
);

export const usePlayerLevel = () => useGamificationStore((s) => s.stats.level);
export const usePlayerXP = () => useGamificationStore((s) => s.stats.totalXP);
