export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpBonus: number;
  condition: { type: string; threshold: number; genre?: string };
  lore: string;
}

export const BADGES: Badge[] = [
  { id: 'first_blood', name: 'Premier Sang', icon: '🩸', description: 'Consulter ta première fiche', rarity: 'common', xpBonus: 10, condition: { type: 'views', threshold: 1 }, lore: 'Le premier pas est le plus difficile.' },
  { id: 'curious_mind', name: 'Esprit Curieux', icon: '🔍', description: 'Consulter 10 groupes', rarity: 'common', xpBonus: 25, condition: { type: 'views', threshold: 10 }, lore: 'La soif de connaissance est un don.' },
  { id: 'collector', name: 'Collectionneur', icon: '⭐', description: 'Ajouter 5 favoris', rarity: 'common', xpBonus: 25, condition: { type: 'favorites', threshold: 5 }, lore: 'Chaque favori est une étoile.' },
  { id: 'true_necro', name: 'True Necro', icon: '🌑', description: 'Consulter 50 groupes de Black Metal', rarity: 'rare', xpBonus: 100, condition: { type: 'views', threshold: 50, genre: 'Black Metal' }, lore: 'Les forêts murmurent ton nom.' },
  { id: 'genre_explorer', name: 'Explorateur des Royaumes', icon: '🗺️', description: 'Explorer 5 genres', rarity: 'rare', xpBonus: 75, condition: { type: 'genres', threshold: 5 }, lore: 'Tu as franchi les frontières.' },
  { id: 'knowledge_keeper', name: 'Gardien du Savoir', icon: '📚', description: 'Consulter 200 groupes', rarity: 'epic', xpBonus: 250, condition: { type: 'views', threshold: 200 }, lore: 'Les Tables brillent à nouveau.' },
  { id: 'horde_leader', name: 'Chef de Horde', icon: '🐺', description: 'Avoir 50 favoris', rarity: 'epic', xpBonus: 250, condition: { type: 'favorites', threshold: 50 }, lore: 'Une armée marche sous ta bannière.' },
  { id: 'metal_god', name: 'Élu des Anciens', icon: '👑', description: 'Atteindre le niveau 50', rarity: 'legendary', xpBonus: 1000, condition: { type: 'special', threshold: 50 }, lore: 'Le Conseil s\'incline devant toi.' },
];

export const RARITY_COLORS = {
  common: '#6b7280',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export function getBadgeRarityColor(rarity: Badge['rarity']): string {
  return RARITY_COLORS[rarity];
}
