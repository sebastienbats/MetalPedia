export interface Rank {
  level: number;
  title: string;
  icon: string;
  description: string;
  xpRequired: number;
  color: string;
}

export const RANKS: Rank[] = [
  { level: 1, title: 'Novice du Silence', icon: '👤', description: 'Tu viens d\'entendre le Premier Riff.', xpRequired: 0, color: '#6b7280' },
  { level: 5, title: 'Écuyer du Riff', icon: '🎸', description: 'Les Anciens t\'ont confié une guitare rouillée.', xpRequired: 500, color: '#92400e' },
  { level: 10, title: 'Chevalier de la Distorsion', icon: '⚔️', description: 'Ton overdrive résonne dans les cavernes.', xpRequired: 2000, color: '#d63031' },
  { level: 20, title: 'Seigneur du Blast Beat', icon: '💀', description: 'Les hordes de Black Metal te reconnaissent.', xpRequired: 8000, color: '#4a148c' },
  { level: 35, title: 'Archimage du Thrash', icon: '🔥', description: 'Ta vitesse est légendaire.', xpRequired: 25000, color: '#ff6f00' },
  { level: 50, title: 'Gardien des Neuf Tables', icon: '📜', description: 'Tu as restauré une partie du Savoir.', xpRequired: 60000, color: '#0277bd' },
  { level: 75, title: 'Pourfendeur de l\'Oubli', icon: '⚡', description: 'Tu es la mémoire vivante du Metalverse.', xpRequired: 150000, color: '#c9a227' },
  { level: 100, title: 'DIEU DU METALVERSE', icon: '👑', description: 'Le Premier Riff était toi depuis toujours.', xpRequired: 500000, color: '#ffffff' },
];

export const XP_RULES = {
  VIEW_BAND: 10,
  ADD_FAVORITE: 25,
  REMOVE_FAVORITE: -10,
  WRITE_REVIEW: 100,
  COMPLETE_QUEST: 150,
  DAILY_LOGIN: 50,
  DISCOVER_NEW_GENRE: 30,
} as const;

export function getRankForLevel(level: number): Rank {
  let currentRank = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.level) currentRank = rank;
  }
  return currentRank;
}

export function getXPForNextLevel(level: number): number {
  const nextRank = RANKS.find((r) => r.level > level);
  return nextRank ? nextRank.xpRequired : Infinity;
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  for (const rank of RANKS) {
    if (totalXP >= rank.xpRequired) level = rank.level;
  }
  return level;
}
