// ═══════════════════════════════════════════════════════════
// LE MOTEUR DU METALVERSE
// Logique de calcul XP, niveaux, progression
// ═══════════════════════════════════════════════════════════

import {
  getLevelFromXP,
  getXPForNextLevel,
  getRankForLevel,
  XP_RULES,
  type Rank,
} from './lore';
import { BADGES, type Badge } from './badges';
import { QUESTS, type Quest } from './quests';
import { GAMIFICATION_PILLARS, type GamificationPillar } from '@/types/api';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

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

export interface LevelProgress {
  currentLevel: number;
  nextLevelXP: number;
  progress: number; // 0-100
  currentRank: Rank;
  xpToNextLevel: number;
}

export interface BadgeUnlockResult {
  badge: Badge;
  isNew: boolean;
}

export interface QuestCompletionResult {
  quest: Quest;
  xpEarned: number;
}

// ─────────────────────────────────────────
// CALCULS XP
// ─────────────────────────────────────────

/**
 * Calcule l'XP à gagner pour une action
 */
export function calculateXP(action: keyof typeof XP_RULES): number {
  return XP_RULES[action] ?? 0;
}

/**
 * Applique un multiplicateur de bonus (streak, événement spécial)
 */
export function applyXPMultiplier(baseXP: number, multiplier: number = 1): number {
  return Math.round(baseXP * multiplier);
}

/**
 * Calcule l'XP totale pour une série d'actions
 */
export function calculateBatchXP(actions: (keyof typeof XP_RULES)[]): number {
  return actions.reduce((total, action) => total + calculateXP(action), 0);
}

// ─────────────────────────────────────────
// VÉRIFICATION DES BADGES
// ─────────────────────────────────────────

/**
 * Vérifie si un badge est débloqué selon les stats du joueur
 */
export function checkBadgeUnlocked(badge: Badge, stats: PlayerStats): boolean {
  const { type, threshold, genre } = badge.condition;

  switch (type) {
    case 'views':
      if (genre) {
        // Logique simplifiée : à affiner avec tracking par genre
        return stats.totalViews >= threshold;
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
 * Vérifie tous les badges non débloqués et retourne les nouveaux
 */
export function checkAllBadges(stats: PlayerStats): BadgeUnlockResult[] {
  const results: BadgeUnlockResult[] = [];

  for (const badge of BADGES) {
    const isAlreadyUnlocked = stats.badgesUnlocked.includes(badge.id);
    const isUnlocked = checkBadgeUnlocked(badge, stats);

    if (isUnlocked && !isAlreadyUnlocked) {
      results.push({ badge, isNew: true });
    }
  }

  return results;
}

// ─────────────────────────────────────────
// VÉRIFICATION DES QUÊTES
// ─────────────────────────────────────────

/**
 * Vérifie si une quête est complétée
 */
export function checkQuestCompleted(quest: Quest, stats: PlayerStats): boolean {
  const { type, target } = quest.requirements;

  switch (type) {
    case 'views':
      return stats.totalViews >= target;

    case 'favorites':
      return stats.totalFavorites >= target;

    case 'reviews':
      return stats.totalReviews >= target;

    case 'genres':
      return stats.genresExplored.length >= target;

    case 'quests':
      return stats.questsCompleted.length >= target;

    default:
      return false;
  }
}

/**
 * Vérifie toutes les quêtes actives et retourne celles complétées
 */
export function checkAllQuests(stats: PlayerStats): QuestCompletionResult[] {
  const results: QuestCompletionResult[] = [];

  for (const quest of QUESTS) {
    const isAlreadyCompleted = stats.questsCompleted.includes(quest.id);
    const isCompleted = checkQuestCompleted(quest, stats);

    if (isCompleted && !isAlreadyCompleted) {
      results.push({ quest, xpEarned: quest.xpReward });
    }
  }

  return results;
}

/**
 * Calcule la progression d'une quête spécifique
 */
export function getQuestProgress(
  quest: Quest,
  stats: PlayerStats
): { current: number; target: number; percent: number } {
  const { type, target } = quest.requirements;
  let current = 0;

  switch (type) {
    case 'views':
      current = stats.totalViews;
      break;
    case 'favorites':
      current = stats.totalFavorites;
      break;
    case 'reviews':
      current = stats.totalReviews;
      break;
    case 'genres':
      current = stats.genresExplored.length;
      break;
    case 'quests':
      current = stats.questsCompleted.length;
      break;
  }

  return {
    current,
    target,
    percent: Math.min(100, (current / target) * 100),
  };
}

// ─────────────────────────────────────────
// PROGRESSION DE NIVEAU
// ─────────────────────────────────────────

/**
 * Calcule la progression vers le prochain niveau
 */
export function getLevelProgress(totalXP: number): LevelProgress {
  const currentLevel = getLevelFromXP(totalXP);
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const currentRank = getRankForLevel(currentLevel);

  const currentLevelXP = currentRank.xpRequired;

  let progress: number;
  if (nextLevelXP === Infinity) {
    progress = 100;
  } else {
    progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  }

  return {
    currentLevel,
    nextLevelXP,
    progress: Math.min(100, Math.max(0, progress)),
    currentRank,
    xpToNextLevel: nextLevelXP === Infinity ? 0 : nextLevelXP - totalXP,
  };
}

/**
 * Vérifie si le joueur a gagné un niveau
 */
export function hasLeveledUp(oldXP: number, newXP: number): boolean {
  return getLevelFromXP(newXP) > getLevelFromXP(oldXP);
}

/**
 * Calcule combien de niveaux ont été gagnés
 */
export function getLevelsGained(oldXP: number, newXP: number): number {
  return getLevelFromXP(newXP) - getLevelFromXP(oldXP);
}

// ─────────────────────────────────────────
// CRÉATION D'ÉVÉNEMENTS XP
// ─────────────────────────────────────────

const XP_DESCRIPTIONS: Record<string, (context?: string) => string> = {
  VIEW_BAND: (ctx) => ctx ? `Rune déchiffrée : ${ctx}` : 'Rune déchiffrée',
  ADD_FAVORITE: (ctx) => ctx ? `Étoile ajoutée : ${ctx}` : 'Étoile ajoutée au firmament',
  REMOVE_FAVORITE: (ctx) => ctx ? `Étoile retirée : ${ctx}` : 'Étoile retirée',
  WRITE_REVIEW: () => 'Sortilège lancé contre l\'Oubli',
  COMPLETE_QUEST: () => 'Quête accomplie pour les Anciens',
  DAILY_LOGIN: () => 'Bénédiction quotidienne des Anciens',
  DISCOVER_NEW_GENRE: (ctx) => ctx ? `Nouveau royaume exploré : ${ctx}` : 'Nouveau royaume découvert',
};

/**
 * Crée un événement XP avec description lore
 */
export function createXPEvent(
  action: keyof typeof XP_RULES,
  context?: string
): XPEvent {
  const descriptionFn = XP_DESCRIPTIONS[action];

  return {
    action,
    amount: calculateXP(action),
    timestamp: Date.now(),
    description: descriptionFn ? descriptionFn(context) : 'Action accomplie',
  };
}

/**
 * Crée plusieurs événements pour un historique complet
 */
export function createXPEvents(
  actions: Array<{ action: keyof typeof XP_RULES; context?: string }>
): XPEvent[] {
  return actions.map(({ action, context }) => createXPEvent(action, context));
}

// ─────────────────────────────────────────
// STATS UTILITIES
// ─────────────────────────────────────────

/**
 * Crée des stats initiales
 */
export function createInitialStats(): PlayerStats {
  return {
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
}

/**
 * Vérifie si le bonus quotidien peut être réclamé
 */
export function canClaimDailyBonus(stats: PlayerStats): boolean {
  if (!stats.lastDailyBonus) return true;

  const today = new Date().toDateString();
  return stats.lastDailyBonus !== today;
}

/**
 * Calcule le pourcentage de complétion global du joueur
 */
export function getCompletionPercentage(stats: PlayerStats): number {
  const totalBadges = BADGES.length;
  const totalQuests = QUESTS.length;

  const badgesPercent = (stats.badgesUnlocked.length / totalBadges) * 50;
  const questsPercent = (stats.questsCompleted.length / totalQuests) * 50;

  return Math.round(badgesPercent + questsPercent);
}

/**
 * Obtient le titre du joueur selon son niveau
 */
export function getPlayerTitle(level: number): string {
  const rank = getRankForLevel(level);
  return rank.title;
}

/**
 * Vérifie si le joueur est au niveau maximum
 */
export function isMaxLevel(stats: PlayerStats): boolean {
  return getXPForNextLevel(stats.level) === Infinity;
}

// ─────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────

/**
 * Analyse l'historique XP pour stats détaillées
 */
export function analyzeXPHistory(history: XPEvent[]): {
  totalEarned: number;
  totalSpent: number;
  netXP: number;
  mostFrequentAction: string;
  xpPerDay: Record<string, number>;
} {
  const totalEarned = history
    .filter((e) => e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSpent = Math.abs(
    history.filter((e) => e.amount < 0).reduce((sum, e) => sum + e.amount, 0)
  );

  const actionCounts: Record<string, number> = {};
  const xpPerDay: Record<string, number> = {};

  history.forEach((event) => {
    // Compter les actions
    actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;

    // XP par jour
    const day = new Date(event.timestamp).toDateString();
    xpPerDay[day] = (xpPerDay[day] || 0) + event.amount;
  });

  const mostFrequentAction = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'NONE';

  return {
    totalEarned,
    totalSpent,
    netXP: totalEarned - totalSpent,
    mostFrequentAction,
    xpPerDay,
  };
}

// ═══════════════════════════════════════════════════════════
// 🆕 NORMALISATION DES GENRES POUR LA GAMIFICATION
// ═══════════════════════════════════════════════════════════

/**
 * Normalise n'importe quel genre en l'un des 9 piliers de gamification.
 * Utilise genre_pillar si fourni, sinon déduit depuis le genre original.
 * 
 * @param genre - Le sous-genre original (ex: "Viking Metal")
 * @param genrePillar - Le pilier pré-calculé (ex: "Folk Metal") - optionnel
 * @returns L'un des 9 piliers de gamification
 */
export function normalizeGenreForGamification(
  genre: string | null | undefined,
  genrePillar?: string | null
): GamificationPillar {
  // 1. Si le pilier est déjà fourni et valide, on l'utilise directement
  if (genrePillar && (GAMIFICATION_PILLARS as readonly string[]).includes(genrePillar)) {
    return genrePillar as GamificationPillar;
  }
  
  // 2. Si le genre original est déjà un pilier, on le garde
  if (genre && (GAMIFICATION_PILLARS as readonly string[]).includes(genre)) {
    return genre as GamificationPillar;
  }
  
  // 3. Sinon, on déduit le pilier depuis le genre original
  if (!genre) return 'Heavy Metal';
  
  const lower = genre.toLowerCase();
  
  if (lower.includes('death') || lower.includes('deathcore')) return 'Death Metal';
  if (lower.includes('black')) return 'Black Metal';
  if (lower.includes('thrash') || lower.includes('speed')) return 'Thrash Metal';
  if (lower.includes('folk') || lower.includes('viking') || lower.includes('pagan')) return 'Folk Metal';
  if (lower.includes('power') || lower.includes('epic') || lower.includes('symphonic')) return 'Power Metal';
  if (lower.includes('doom') || lower.includes('sludge') || lower.includes('stoner')) return 'Doom Metal';
  if (lower.includes('progressive') || lower.includes('djent') || lower.includes('post')) return 'Progressive Metal';
  if (lower.includes('core') || lower.includes('hardcore')) return 'Metalcore';
  
  // 4. Fallback : Heavy Metal
  return 'Heavy Metal';
}
