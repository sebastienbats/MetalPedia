import { getLevelFromXP, getXPForNextLevel, getRankForLevel, XP_RULES } from './lore';
import { BADGES, Badge } from './badges';
import { QUESTS, Quest } from './quests';

export interface PlayerStats {
  totalViews: number;
  totalFavorites: number;
  totalReviews: number;
  genresExplored: string[];
  questsCompleted: string[];
  badgesUnlocked: string[];
  totalXP: number;
  level: number;
  lastDailyBonus: string | null;
}

export interface XPEvent {
  action: string;
  amount: number;
  timestamp: number;
  description: string;
}

export function calculateXP(action: keyof typeof XP_RULES): number {
  return XP_RULES[action];
}

export function checkBadgeUnlocked(badge: Badge, stats: PlayerStats): boolean {
  const { type, threshold } = badge.condition;
  switch (type) {
    case 'views': return stats.totalViews >= threshold;
    case 'favorites': return stats.totalFavorites >= threshold;
    case 'genres': return stats.genresExplored.length >= threshold;
    case 'quests': return stats.questsCompleted.length >= threshold;
    case 'special': return stats.level >= threshold;
    default: return false;
  }
}

export function checkQuestCompleted(quest: Quest, stats: PlayerStats): boolean {
  const { type, target } = quest.requirements;
  switch (type) {
    case 'views': return stats.totalViews >= target;
    case 'favorites': return stats.totalFavorites >= target;
    default: return false;
  }
}

export function getLevelProgress(totalXP: number) {
  const currentLevel = getLevelFromXP(totalXP);
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const currentRank = getRankForLevel(currentLevel);
  const currentLevelXP = currentRank.xpRequired;
  const progress = nextLevelXP === Infinity ? 100 : ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return { currentLevel, nextLevelXP, progress: Math.min(100, Math.max(0, progress)), currentRank };
}

export function createXPEvent(action: keyof typeof XP_RULES, context?: string): XPEvent {
  return {
    action,
    amount: calculateXP(action),
    timestamp: Date.now(),
    description: context || action,
  };
}
