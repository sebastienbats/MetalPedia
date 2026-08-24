/**
 * LA LÉGENDE DU METALVERSE
 * Hiérarchie des rangs, du Novice au Dieu du Metal
 */

export interface Rank {
  level: number;
  title: string;
  icon: string;
  description: string;
  xpRequired: number;
  color: string;
  privileges: string[];
}

export const RANKS: Rank[] = [
  {
    level: 1,
    title: 'Novice du Silence',
    icon: '👤',
    description: 'Tu viens d'entendre le Premier Riff. Le voyage commence.',
    xpRequired: 0,
    color: '#6b7280',
    privileges: ['Accès aux fiches de base'],
  },
  {
    level: 5,
    title: 'Écuyer du Riff',
    icon: '🎸',
    description: 'Les Anciens t'ont confié une guitare rouillée. Fais-en bon usage.',
    xpRequired: 500,
    color: '#92400e',
    privileges: ['Déblocage des statistiques personnelles'],
  },
  {
    level: 10,
    title: 'Chevalier de la Distorsion',
    icon: '⚔️',
    description: 'Ton overdrive résonne dans les cavernes du Metalverse.',
    xpRequired: 2000,
    color: '#d63031',
    privileges: ['Accès au Graphe de Similarité', 'Thème Hellfire débloqué'],
  },
  {
    level: 20,
    title: 'Seigneur du Blast Beat',
    icon: '💀',
    description: 'Les hordes de Black Metal te reconnaissent comme l'un des leurs.',
    xpRequired: 8000,
    color: '#4a148c',
    privileges: ['Accès aux recommandations ML', 'Thème Cathédrale débloqué'],
  },
  {
    level: 35,
    title: 'Archimage du Thrash',
    icon: '🔥',
    description: 'Ta vitesse d'exécution est légendaire. Les riffs tremblent devant toi.',
    xpRequired: 25000,
    color: '#ff6f00',
    privileges: ['Générateur de logos IA illimité'],
  },
  {
    level: 50,
    title: 'Gardien des Neuf Tables',
    icon: '📜',
    description: 'Tu as restauré une partie du Savoir perdu. Les Anciens te bénissent.',
    xpRequired: 60000,
    color: '#0277bd',
    privileges: ['Accès anticipé aux nouvelles fonctionnalités'],
  },
  {
    level: 75,
    title: 'Pourfendeur de l'Oubli',
    icon: '⚡',
    description: 'Aucun groupe obscur ne t'échappe. Tu es la mémoire vivante du Metalverse.',
    xpRequired: 150000,
    color: '#c9a227',
    privileges: ['Badge exclusif "Légende"'],
  },
  {
    level: 100,
    title: 'DIEU DU METALVERSE',
    icon: '👑',
    description: 'Tu as transcendé la mortalité. Le Premier Riff était toi depuis toujours.',
    xpRequired: 500000,
    color: '#ffffff',
    privileges: ['Immortalité numérique', 'Accès aux coulisses du développement'],
  },
];

export const XP_RULES = {
  VIEW_BAND: 10,
  ADD_FAVORITE: 25,
  REMOVE_FAVORITE: -10,
  WRITE_REVIEW: 100,
  COMPLETE_QUEST: 150,
  DAILY_LOGIN: 50,
  DISCOVER_NEW_GENRE: 30,
  VISIT_MAP: 20,
  VISIT_TIMELINE: 20,
  GENERATE_LOGO: 40,
} as const;

export function getRankForLevel(level: number): Rank {
  let currentRank = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.level) {
      currentRank = rank;
    } else {
      break;
    }
  }
  return currentRank;
}

export function getXPForNextLevel(level: number): number {
  const currentRank = getRankForLevel(level);
  const nextRankIndex = RANKS.findIndex((r) => r.level > level);
  if (nextRankIndex === -1) return Infinity;
  return RANKS[nextRankIndex].xpRequired;
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  for (const rank of RANKS) {
    if (totalXP >= rank.xpRequired) {
      level = rank.level;
    }
  }
  return level;
}
