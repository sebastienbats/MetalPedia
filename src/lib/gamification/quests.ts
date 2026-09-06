import type { CharacterClass } from '@/types/api';

// ═══════════════════════════════════════════════════════════
// INTERFACE
// ═══════════════════════════════════════════════════════════

export interface Quest {
  id: string;
  name: string;
  icon: string;
  description: string;
  lore: string;
  difficulty: 'novice' | 'apprentice' | 'master' | 'legendary';
  xpReward: number;
  requirements: { type: string; target: number };
  requiredClass?: CharacterClass; // 🆕 Optionnel : si défini, la quête est réservée à cette classe
}

// ═══════════════════════════════════════════════════════════
// COULEURS DES DIFFICULTÉS
// ═══════════════════════════════════════════════════════════

export const DIFFICULTY_COLORS = {
  novice: '#22c55e',
  apprentice: '#3b82f6',
  master: '#a855f7',
  legendary: '#f59e0b',
};

// ═══════════════════════════════════════════════════════════
// QUÊTES GÉNÉRALES (Accessibles à toutes les classes)
// ═══════════════════════════════════════════════════════════

export const QUESTS: Quest[] = [
  // ─────────────────────────────────────────────────────
  // NOVICE
  // ─────────────────────────────────────────────────────
  {
    id: 'first_steps',
    name: 'Premiers Pas',
    icon: '🕯️',
    description: 'Consulter 5 fiches',
    lore: 'Les Anciens t\'observent.',
    difficulty: 'novice',
    xpReward: 50,
    requirements: { type: 'views', target: 5 },
  },
  {
    id: 'first_favorite',
    name: 'Première Étoile',
    icon: '⭐',
    description: 'Ajouter un favori',
    lore: 'Chaque étoile compte.',
    difficulty: 'novice',
    xpReward: 30,
    requirements: { type: 'favorites', target: 1 },
  },

  // ─────────────────────────────────────────────────────
  // MASTER
  // ─────────────────────────────────────────────────────
  {
    id: 'knowledge_seeker',
    name: 'Chercheur de Savoir',
    icon: '📖',
    description: 'Consulter 50 groupes',
    lore: 'Les Tables se reconstituent.',
    difficulty: 'master',
    xpReward: 250,
    requirements: { type: 'views', target: 50 },
  },
  {
    id: 'horde_builder',
    name: 'Bâtisseur de Horde',
    icon: '🐺',
    description: 'Avoir 20 favoris',
    lore: 'Une armée se forme.',
    difficulty: 'master',
    xpReward: 200,
    requirements: { type: 'favorites', target: 20 },
  },

  // ─────────────────────────────────────────────────────
  // LEGENDARY
  // ─────────────────────────────────────────────────────
  {
    id: 'table_restorer',
    name: 'Restaureur des Tables',
    icon: '📜',
    description: 'Consulter 500 groupes',
    lore: 'Le Savoir renaît.',
    difficulty: 'legendary',
    xpReward: 1000,
    requirements: { type: 'views', target: 500 },
  },

  // ═══════════════════════════════════════════════════════════
  // QUÊTES SPÉCIALES PAR CLASSE (Phase 2)
  // Accessibles uniquement si le joueur a choisi la classe correspondante
  // ═══════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────
  // 🖤 BLACK METAL - Nécromancien des Ombres
  // ─────────────────────────────────────────────────────
  {
    id: 'class_necromancer_1',
    name: 'L\'Appel des Ténèbres',
    icon: '🌑',
    description: 'Consulter 20 fiches de groupes',
    lore: 'Le Nécromancien ne craint pas l\'inconnu. Il plonge dans les abysses pour y déterrer les secrets oubliés.',
    difficulty: 'master',
    xpReward: 500,
    requirements: { type: 'views', target: 20 },
    requiredClass: 'necromancer',
  },

  // ─────────────────────────────────────────────────────
  // 💀 DEATH METAL - Bourreau Sonore
  // ─────────────────────────────────────────────────────
  {
    id: 'class_executioner_1',
    name: 'Le Jugement Dernier',
    icon: '☠️',
    description: 'Rendre 3 verdicts (laisser 3 avis)',
    lore: 'Le Bourreau Sonore tranche sans pitié. Chaque avis est un coup de hache qui sépare les vrais guerriers des imposteurs.',
    difficulty: 'master',
    xpReward: 400,
    requirements: { type: 'reviews', target: 3 },
    requiredClass: 'executioner',
  },

  // ─────────────────────────────────────────────────────
  // 🎸 HEAVY METAL - Paladin du Riff
  // ─────────────────────────────────────────────────────
  {
    id: 'class_paladin_1',
    name: 'Le Serment du Riff',
    icon: '⚔️',
    description: 'Explorer 5 piliers de genres différents',
    lore: 'Le Paladin du Riff parcourt les Sept Royaumes, portant haut l\'étendard du Metal sous toutes ses formes.',
    difficulty: 'legendary',
    xpReward: 600,
    requirements: { type: 'genres', target: 5 },
    requiredClass: 'paladin',
  },

  // ─────────────────────────────────────────────────────
  // ⚡ THRASH METAL - Berserker de la Vitesse
  // ─────────────────────────────────────────────────────
  {
    id: 'class_berserker_1',
    name: 'Furie Vengeresse',
    icon: '🤘',
    description: 'Consulter 30 fiches de groupes',
    lore: 'Le Berserker ne connaît qu\'une loi : la vitesse. Il fonce tête baissée à travers les décennies, laissant une traînée de riffs dans son sillage.',
    difficulty: 'master',
    xpReward: 500,
    requirements: { type: 'views', target: 30 },
    requiredClass: 'berserker',
  },

  // ─────────────────────────────────────────────────────
  // ✨ POWER METAL - Barde Épique
  // ─────────────────────────────────────────────────────
  {
    id: 'class_bard_1',
    name: 'La Grande Épopée',
    icon: '🎼',
    description: 'Collectionner 10 groupes légendaires en favoris',
    lore: 'Le Barde Épique chante les hauts faits des groupes légendaires. Chaque favori est une strophe de plus dans la grande saga du Power Metal.',
    difficulty: 'master',
    xpReward: 450,
    requirements: { type: 'favorites', target: 10 },
    requiredClass: 'bard',
  },

  // ─────────────────────────────────────────────────────
  // 🕯️ DOOM METAL - Gardien du Vide
  // ─────────────────────────────────────────────────────
  {
    id: 'class_void_guardian_1',
    name: 'Méditation Profonde',
    icon: '🕳️',
    description: 'Consulter 15 fiches de groupes',
    lore: 'Le Gardien du Vide médite dans les temples oubliés, là où le temps s\'étire à l\'infini. Chaque fiche consultée est un pas vers la vérité.',
    difficulty: 'apprentice',
    xpReward: 400,
    requirements: { type: 'views', target: 15 },
    requiredClass: 'void_guardian',
  },

  // ─────────────────────────────────────────────────────
  // 🌀 PROGRESSIVE METAL - Architecte du Chaos
  // ─────────────────────────────────────────────────────
  {
    id: 'class_chaos_architect_1',
    name: 'L\'Énigme du Labyrinthe',
    icon: '🧩',
    description: 'Compléter au moins 1 quête pour prouver ton esprit d\'analyse',
    lore: 'L\'Architecte du Chaos déconstruit le Metal pour mieux le comprendre. Chaque quête accomplie est un puzzle résolu avec une précision mathématique.',
    difficulty: 'master',
    xpReward: 600,
    requirements: { type: 'quests', target: 1 },
    requiredClass: 'chaos_architect',
  },

  // ─────────────────────────────────────────────────────
  // 🍀 FOLK METAL - Chaman des Racines
  // ─────────────────────────────────────────────────────
  {
    id: 'class_shaman_1',
    name: 'Pèlerinage Ancestral',
    icon: '🌿',
    description: 'Explorer 3 piliers de genres différents',
    lore: 'Le Chaman des Racines parcourt le monde, collectant les mélodies ancestrales de chaque contrée. Chaque pilier exploré est une terre promise.',
    difficulty: 'master',
    xpReward: 500,
    requirements: { type: 'genres', target: 3 },
    requiredClass: 'shaman',
  },

  // ─────────────────────────────────────────────────────
  // 🔗 METALCORE - Briseur de Chaînes
  // ─────────────────────────────────────────────────────
  {
    id: 'class_chain_breaker_1',
    name: 'La Révolte Grondante',
    icon: '⛓️',
    description: 'Laisser ton premier avis sur la scène actuelle',
    lore: 'Le Briseur de Chaînes refuse de laisser le Metal devenir une relique. Il soutient les groupes actifs qui repoussent les limites du genre.',
    difficulty: 'apprentice',
    xpReward: 400,
    requirements: { type: 'reviews', target: 1 },
    requiredClass: 'chain_breaker',
  },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Récupère les quêtes disponibles pour une classe donnée.
 * Inclut les quêtes générales + les quêtes spécifiques à la classe.
 */
export function getQuestsForClass(userClass: CharacterClass | null): Quest[] {
  return QUESTS.filter((quest) => {
    if (!quest.requiredClass) return true; // Quête générale
    return quest.requiredClass === userClass; // Quête de classe correspondant
  });
}

/**
 * Récupère uniquement les quêtes spécifiques à une classe.
 */
export function getClassSpecificQuests(userClass: CharacterClass): Quest[] {
  return QUESTS.filter((quest) => quest.requiredClass === userClass);
}
