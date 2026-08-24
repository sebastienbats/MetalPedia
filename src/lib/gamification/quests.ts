export interface Quest {
  id: string;
  name: string;
  icon: string;
  description: string;
  lore: string;
  difficulty: 'novice' | 'apprentice' | 'master' | 'legendary';
  xpReward: number;
  requirements: { type: string; target: number };
}

export const QUESTS: Quest[] = [
  { id: 'first_steps', name: 'Premiers Pas', icon: '🕯️', description: 'Consulter 5 fiches', lore: 'Les Anciens t\'observent.', difficulty: 'novice', xpReward: 50, requirements: { type: 'views', target: 5 } },
  { id: 'first_favorite', name: 'Première Étoile', icon: '⭐', description: 'Ajouter un favori', lore: 'Chaque étoile compte.', difficulty: 'novice', xpReward: 30, requirements: { type: 'favorites', target: 1 } },
  { id: 'knowledge_seeker', name: 'Chercheur de Savoir', icon: '📖', description: 'Consulter 50 groupes', lore: 'Les Tables se reconstituent.', difficulty: 'master', xpReward: 250, requirements: { type: 'views', target: 50 } },
  { id: 'horde_builder', name: 'Bâtisseur de Horde', icon: '🐺', description: 'Avoir 20 favoris', lore: 'Une armée se forme.', difficulty: 'master', xpReward: 200, requirements: { type: 'favorites', target: 20 } },
  { id: 'table_restorer', name: 'Restaureur des Tables', icon: '📜', description: 'Consulter 500 groupes', lore: 'Le Savoir renaît.', difficulty: 'legendary', xpReward: 1000, requirements: { type: 'views', target: 500 } },
];

export const DIFFICULTY_COLORS = {
  novice: '#22c55e',
  apprentice: '#3b82f6',
  master: '#a855f7',
  legendary: '#f59e0b',
};
