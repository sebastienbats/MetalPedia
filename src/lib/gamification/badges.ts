/**
 * LES RELIQUES DES ANCIENS
 * Badges et achievements à collectionner
 */

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpBonus: number;
  condition: {
    type: 'views' | 'favorites' | 'reviews' | 'genres' | 'quests' | 'special';
    threshold: number;
    genre?: string;
  };
  lore: string;
}

export const BADGES: Badge[] = [
  // ═══════════════ BADGES COMMUNS ═══════════════
  {
    id: 'first_blood',
    name: 'Premier Sang',
    icon: '🩸',
    description: 'Consulter ta première fiche de groupe',
    rarity: 'common',
    xpBonus: 10,
    condition: { type: 'views', threshold: 1 },
    lore: 'Le premier pas dans les ténèbres est toujours le plus difficile.',
  },
  {
    id: 'curious_mind',
    name: 'Esprit Curieux',
    icon: '🔍',
    description: 'Consulter 10 groupes différents',
    rarity: 'common',
    xpBonus: 25,
    condition: { type: 'views', threshold: 10 },
    lore: 'La soif de connaissance est le premier don des Anciens.',
  },
  {
    id: 'collector',
    name: 'Collectionneur',
    icon: '⭐',
    description: 'Ajouter 5 groupes à tes favoris',
    rarity: 'common',
    xpBonus: 25,
    condition: { type: 'favorites', threshold: 5 },
    lore: 'Chaque favori est une étoile dans ton firmament personnel.',
  },

  // ═══════════════ BADGES RARES ═══════════════
  {
    id: 'true_necro',
    name: 'True Necro',
    icon: '🌑',
    description: 'Consulter 50 groupes de Black Metal',
    rarity: 'rare',
    xpBonus: 100,
    condition: { type: 'views', threshold: 50, genre: 'Black Metal' },
    lore: 'Les forêts norvégiennes murmurent ton nom dans la nuit.',
  },
  {
    id: 'death_bringer',
    name: 'Porteur de Mort',
    icon: '💀',
    description: 'Consulter 50 groupes de Death Metal',
    rarity: 'rare',
    xpBonus: 100,
    condition: { type: 'views', threshold: 50, genre: 'Death Metal' },
    lore: 'Le growl est ta langue maternelle.',
  },
  {
    id: 'thrash_berserker',
    name: 'Thrash Berserker',
    icon: '⚡',
    description: 'Consulter 50 groupes de Thrash Metal',
    rarity: 'rare',
    xpBonus: 100,
    condition: { type: 'views', threshold: 50, genre: 'Thrash Metal' },
    lore: 'La vitesse est ta seule religion.',
  },
  {
    id: 'genre_explorer',
    name: 'Explorateur des Neuf Royaumes',
    icon: '🗺️',
    description: 'Explorer 5 genres différents',
    rarity: 'rare',
    xpBonus: 75,
    condition: { type: 'genres', threshold: 5 },
    lore: 'Tu as franchi les frontières entre les royaumes du Metalverse.',
  },
  {
    id: 'quest_apprentice',
    name: 'Apprenti des Quêtes',
    icon: '📜',
    description: 'Compléter 5 quêtes',
    rarity: 'rare',
    xpBonus: 100,
    condition: { type: 'quests', threshold: 5 },
    lore: 'Les Anciens reconnaissent ta dévotion.',
  },

  // ═══════════════ BADGES ÉPIQUES ═══════════════
  {
    id: 'knowledge_keeper',
    name: 'Gardien du Savoir',
    icon: '📚',
    description: 'Consulter 200 groupes différents',
    rarity: 'epic',
    xpBonus: 250,
    condition: { type: 'views', threshold: 200 },
    lore: 'Les Tables du Savoir brillent à nouveau grâce à toi.',
  },
  {
    id: 'horde_leader',
    name: 'Chef de Horde',
    icon: '🐺',
    description: 'Avoir 50 favoris',
    rarity: 'epic',
    xpBonus: 250,
    condition: { type: 'favorites', threshold: 50 },
    lore: 'Une armée de groupes marche sous ta bannière.',
  },
  {
    id: 'lore_master',
    name: 'Maître du Lore',
    icon: '✍️',
    description: 'Écrire 10 reviews',
    rarity: 'epic',
    xpBonus: 300,
    condition: { type: 'reviews', threshold: 10 },
    lore: 'Tes écrits deviendront les légendes de demain.',
  },

  // ═══════════════ BADGES LÉGENDAIRES ═══════════════
  {
    id: 'metal_god',
    name: 'Élu des Anciens',
    icon: '👑',
    description: 'Atteindre le niveau 50',
    rarity: 'legendary',
    xpBonus: 1000,
    condition: { type: 'special', threshold: 50 },
    lore: 'Le Conseil des Neuf Genres s'incline devant ta grandeur.',
  },
  {
    id: 'completionist',
    name: 'Restaureur des Tables',
    icon: '🏆',
    description: 'Compléter 50 quêtes',
    rarity: 'legendary',
    xpBonus: 1000,
    condition: { type: 'quests', threshold: 50 },
    lore: 'Le Metalverse est restauré. Ton nom est gravé dans l'éternité.',
  },
];

export const RARITY_COLORS = {
  common: '#6b7280',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
} as const;

export function getBadgeRarityColor(rarity: Badge['rarity']): string {
  return RARITY_COLORS[rarity];
}
