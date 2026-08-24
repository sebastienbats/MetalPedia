/**
 * LE MOTEUR DU METALVERSE
 * Logique de calcul XP, niveaux, progression
 */

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
  action: keyof typeof XP_RULES;
  amount: number;
  timestamp: number;
  description: string;
}

/**
 * Calcule l'XP à gagner pour une action
 */
export function calculateXP(action: keyof typeof XP_RULES): number {
  return XP_RULES[action];
}

/**
 * Vérifie si un badge est débloqué
 */
export function checkBadgeUnlocked(
  badge: Badge,
  stats: PlayerStats
): boolean {
  const { type, threshold, genre } = badge.condition;

  switch (type) {
    case 'views':
      if (genre) {
        // Logique simplifiée : on compte les vues par genre via stats
        return stats.totalViews >= threshold; // À affiner avec tracking par genre
      }
      return stats.totalViews >= threshold;

    case 'favorites':
      return stats.totalFavorites >= threshold;

    case 'reviews':
      return stats.totalReviews >= threshold;

    case 'genres':
      return stats.genresExplored.length >= threshold;

    case 'quests':
      return stats.questsCompleted.length >= threshold;

    case 'special':
      return stats.level >= threshold;

    default:
      return false;
  }
}

/**
 * Vérifie si une quête est complétée
 */
export function checkQuestCompleted(
  quest: Quest,
  stats: PlayerStats
): boolean {
  const { type, target, genre } = quest.requirements;

  switch (type) {
    case 'views':
      return stats.totalViews >= target;
    case 'favorites':
      return stats.totalFavorites >= target;
    case 'reviews':
      return stats.totalReviews >= target;
    case 'genres':
      return stats.genresExplored.length >= target;
    default:
      return false;
  }
}

/**
 * Calcule la progression vers le prochain niveau
 */
export function getLevelProgress(totalXP: number): {
  currentLevel: number;
  nextLevelXP: number;
  progress: number; // 0-100
  currentRank: ReturnType<typeof getRankForLevel>;
} {
  const currentLevel = getLevelFromXP(totalXP);
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const currentRank = getRankForLevel(currentLevel);

  const currentLevelXP = currentRank.xpRequired;
  const progress = nextLevelXP === Infinity
    ? 100
    : ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return {
    currentLevel,
    nextLevelXP,
    progress: Math.min(100, Math.max(0, progress)),
    currentRank,
  };
}

/**
 * Génère un événement XP avec description lore
 */
export function createXPEvent(
  action: keyof typeof XP_RULES,
  context?: string
): XPEvent {
  const descriptions: Record<string, string> = {
    VIEW_BAND: context ? `Rune déchiffrée : ${context}` : 'Rune déchiffrée',
    ADD_FAVORITE: context ? `Étoile ajoutée : ${context}` : 'Étoile ajoutée',
    WRITE_REVIEW: 'Sortilège lancé',
    COMPLETE_QUEST: 'Quête accomplie',
    DAILY_LOGIN: 'Bénédiction quotidienne des Anciens',
    DISCOVER_NEW_GENRE: context ? `Nouveau royaume exploré : ${context}` : 'Nouveau royaume exploré',
  };

  return {
    action,
    amount: calculateXP(action),
    timestamp: Date.now(),
    description: descriptions[action] || 'Action accomplie',
  };
}
