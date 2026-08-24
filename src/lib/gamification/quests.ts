/**
 * LES QUÊTES ÉPIQUES
 * Missions à accomplir pour restaurer le Savoir
 */

export interface Quest {
  id: string;
  name: string;
  icon: string;
  description: string;
  lore: string;
  difficulty: 'novice' | 'apprentice' | 'master' | 'legendary';
  xpReward: number;
  requirements: {
    type: 'views' | 'favorites' | 'reviews' | 'genres' | 'special';
    target: number;
    genre?: string;
  };
  repeatable: boolean;
}

export const QUESTS: Quest[] = [
  // ═══════════════ QUÊTES NOVICE ═══════════════
  {
    id: 'first_steps',
    name: 'Premiers Pas dans les Ténèbres',
    icon: '🕯️',
    description: 'Consulter 5 fiches de groupes',
    lore: 'Les Anciens t'observent. Prouve que tu es digne du Savoir.',
    difficulty: 'novice',
    xpReward: 50,
    requirements: { type: 'views', target: 5 },
    repeatable: false,
  },
  {
    id: 'first_favorite',
    name: 'Première Étoile',
    icon: '⭐',
    description: 'Ajouter ton premier groupe aux favoris',
    lore: 'Chaque étoile dans le firmament du Metalverse compte.',
    difficulty: 'novice',
    xpReward: 30,
    requirements: { type: 'favorites', target: 1 },
    repeatable: false,
  },

  // ═══════════════ QUÊTES APPRENTICE ═══════════════
  {
    id: 'black_metal_initiation',
    name: 'Initiation au Black Metal',
    icon: '🌑',
    description: 'Consulter 10 groupes de Black Metal',
    lore: 'Les forêts de Norvège t'appellent. Réponds à leur chant.',
    difficulty: 'apprentice',
    xpReward: 100,
    requirements: { type: 'views', target: 10, genre: 'Black Metal' },
    repeatable: false,
  },
  {
    id: 'death_metal_baptism',
    name: 'Baptême du Death Metal',
    icon: '💀',
    description: 'Consulter 10 groupes de Death Metal',
    lore: 'Le growl des profondeurs résonne. Es-tu prêt à l'entendre ?',
    difficulty: 'apprentice',
    xpReward: 100,
    requirements: { type: 'views', target: 10, genre: 'Death Metal' },
    repeatable: false,
  },
  {
    id: 'thrash_trial',
    name: 'Épreuve du Thrash',
    icon: '⚡',
    description: 'Consulter 10 groupes de Thrash Metal',
    lore: 'La vitesse est ta seule alliée dans cette épreuve.',
    difficulty: 'apprentice',
    xpReward: 100,
    requirements: { type: 'views', target: 10, genre: 'Thrash Metal' },
    repeatable: false,
  },
  {
    id: 'genre_tourist',
    name: 'Touriste des Royaumes',
    icon: '🗺️',
    description: 'Explorer 3 genres différents',
    lore: 'Chaque royaume du Metalverse a ses secrets.',
    difficulty: 'apprentice',
    xpReward: 75,
    requirements: { type: 'genres', target: 3 },
    repeatable: false,
  },

  // ═══════════════ QUÊTES MASTER ═══════════════
  {
    id: 'knowledge_seeker',
    name: 'Chercheur de Savoir',
    icon: '📖',
    description: 'Consulter 50 groupes différents',
    lore: 'Les Tables du Savoir se reconstituent lentement grâce à toi.',
    difficulty: 'master',
    xpReward: 250,
    requirements: { type: 'views', target: 50 },
    repeatable: false,
  },
  {
    id: 'horde_builder',
    name: 'Bâtisseur de Horde',
    icon: '🐺',
    description: 'Avoir 20 favoris',
    lore: 'Une armée se forme sous ta bannière.',
    difficulty: 'master',
    xpReward: 200,
    requirements: { type: 'favorites', target: 20 },
    repeatable: false,
  },
  {
    id: 'first_review',
    name: 'Premier Sortilège',
    icon: '✍️',
    description: 'Écrire ta première review',
    lore: 'Les mots sont des sorts. Lance ton premier sortilège.',
    difficulty: 'master',
    xpReward: 150,
    requirements: { type: 'reviews', target: 1 },
    repeatable: false,
  },

  // ═══════════════ QUÊTES LÉGENDAIRES ═══════════════
  {
    id: 'table_restorer',
    name: 'Restaureur des Tables',
    icon: '📜',
    description: 'Consulter 500 groupes différents',
    lore: 'Le Savoir perdu renaît. Tu es l'élu des Anciens.',
    difficulty: 'legendary',
    xpReward: 1000,
    requirements: { type: 'views', target: 500 },
    repeatable: false,
  },
  {
    id: 'metal_legion',
    name: 'Légion du Metal',
    icon: '⚔️',
    description: 'Avoir 100 favoris',
    lore: 'Cent âmes métalliques marchent à tes côtés.',
    difficulty: 'legendary',
    xpReward: 800,
    requirements: { type: 'favorites', target: 100 },
    repeatable: false,
  },
  {
    id: 'lore_keeper',
    name: 'Gardien du Lore',
    icon: '🏛️',
    description: 'Écrire 25 reviews',
    lore: 'Tes écrits sont devenus les nouvelles Tables du Savoir.',
    difficulty: 'legendary',
    xpReward: 1200,
    requirements: { type: 'reviews', target: 25 },
    repeatable: false,
  },
];

export const DIFFICULTY_COLORS = {
  novice: '#22c55e',
  apprentice: '#3b82f6',
  master: '#a855f7',
  legendary: '#f59e0b',
} as const;
