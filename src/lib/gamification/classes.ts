import type { CharacterClass, ClassMetadata, GamificationPillar } from '@/types/api';

// ═══════════════════════════════════════════════════════════
// LES 9 CLASSES DU METALVERSE
// ═══════════════════════════════════════════════════════════

export const CHARACTER_CLASSES: Record<CharacterClass, ClassMetadata> = {
  // ─────────────────────────────────────────────────────
  // 🖤 BLACK METAL - Nécromancien des Ombres
  // ─────────────────────────────────────────────────────
  necromancer: {
    id: 'necromancer',
    name: 'Nécromancien des Ombres',
    icon: '🌑',
    pillar: 'Black Metal' as GamificationPillar,
    description: 'Expert des groupes obscurs et underground. Tu trouves la beauté là où d\'autres ne voient que les ténèbres.',
    lore: 'Né dans les cryptes oubliées du Metalverse, le Nécromancien parcourt les recoins les plus sombres de l\'encyclopédie. Là où les autres hésitent, lui avance, guidé par l\'appel des groupes dont le nom n\'est murmuré que dans les catacombes.',
    color: '#6b21a8',
    bonus: {
      type: 'low_listeners',
      multiplier: 1.5, // +50% XP
      threshold: 1000, // Groupes avec moins de 1000 auditeurs
    },
    titles: [
      { level: 1, title: 'Apprenti des Cryptes' },
      { level: 5, title: 'Fouilleur de Tombes' },
      { level: 10, title: 'Maître des Ombres' },
      { level: 20, title: 'Seigneur Nécromant' },
      { level: 50, title: 'Roi des Morts-Vivants du Metal' },
    ],
  },

  // ─────────────────────────────────────────────────────
  // 💀 DEATH METAL - Bourreau Sonore
  // ─────────────────────────────────────────────────────
  executioner: {
    id: 'executioner',
    name: 'Bourreau Sonore',
    icon: '☠️',
    pillar: 'Death Metal' as GamificationPillar,
    description: 'Chasseur impitoyable de brutalité. Ta plume est aussi tranchante que les riffs que tu découvres.',
    lore: 'Le Bourreau Sonore arpente les champs de bataille du Death Metal, laissant derrière lui une traînée de reviews cinglantes. Chaque avis qu\'il rédige est un coup de hache qui tranche dans le vif, séparant les vrais guerriers des imposteurs.',
    color: '#991b1b',
    bonus: {
      type: 'reviews',
      multiplier: 1.3, // +30% XP
    },
    titles: [
      { level: 1, title: 'Apprenti Bourreau' },
      { level: 5, title: 'Exécuteur Novice' },
      { level: 10, title: 'Maître de la Hache' },
      { level: 20, title: 'Grand Exécuteur' },
      { level: 50, title: 'Juge Suprême du Death' },
    ],
  },

  // ─────────────────────────────────────────────────────
  // 🎸 HEAVY METAL - Paladin du Riff
  // ─────────────────────────────────────────────────────
  paladin: {
    id: 'paladin',
    name: 'Paladin du Riff',
    icon: '⚔️',
    pillar: 'Heavy Metal' as GamificationPillar,
    description: 'Gardien des traditions et champion de l\'équilibre. Ta force réside dans la constance.',
    lore: 'Le Paladin du Riff est le chevalier errant du Metalverse, portant haut l\'étendard du Heavy Metal classique. Là où il passe, les mélodies s\'élèvent et les riffs résonnent. Sa quête : préserver la pureté du Metal originel.',
    color: '#ca8a04',
    bonus: {
      type: 'all',
      multiplier: 1.2, // +20% XP sur tout
    },
    titles: [
      { level: 1, title: 'Écuyer du Riff' },
      { level: 5, title: 'Chevalier du Metal' },
      { level: 10, title: 'Paladin Émérite' },
      { level: 20, title: 'Champion des Sept Royaumes' },
      { level: 50, title: 'Légende Vivante du Heavy' },
    ],
  },

  // ─────────────────────────────────────────────────────
  // ⚡ THRASH METAL - Berserker de la Vitesse
  // ─────────────────────────────────────────────────────
  berserker: {
    id: 'berserker',
    name: 'Berserker de la Vitesse',
    icon: '🤘',
    pillar: 'Thrash Metal' as GamificationPillar,
    description: 'Speed demon intrépide. Tu fonces tête baissée vers les classiques de l\'âge d\'or.',
    lore: 'Le Berserker de la Vitesse ne connaît qu\'une loi : la vitesse. Les doigts sur le manche, il fonce à travers les décennies, ne s\'arrêtant que devant les monuments du Thrash des années 80. Chaque riff rapide est un cri de guerre.',
    color: '#ea580c',
    bonus: {
      type: 'vintage',
      multiplier: 1.4, // +40% XP
      threshold: 1990, // Groupes formés avant 1990
    },
    titles: [
      { level: 1, title: 'Coureur du Mosh Pit' },
      { level: 5, title: 'Fou du Circle Pit' },
      { level: 10, title: 'Berserker Déchaîné' },
      { level: 20, title: 'Seigneur de la Vitesse' },
      { level: 50, title: 'Dieu du Thrash Ancien' },
    ],
  },

  // ─────────────────────────────────────────────────────
  // ✨ POWER METAL - Barde Épique
  // ─────────────────────────────────────────────────────
  bard: {
    id: 'bard',
    name: 'Barde Épique',
    icon: '🎼',
    pillar: 'Power Metal' as GamificationPillar,
    description: 'Conteur de légendes et collectionneur de mélodies. Chaque album est un chapitre de ton épopée.',
    lore: 'Le Barde Épique parcourt le Metalverse un luth à la main, chantant les hauts faits des groupes légendaires. Chaque album qu\'il ajoute à sa collection est une strophe de plus dans la grande saga du Power Metal.',
    color: '#0891b2',
    bonus: {
      type: 'favorites',
      multiplier: 1.25, // +25% XP
    },
    titles: [
      { level: 1, title: 'Ménétrier Errant' },
      { level: 5, title: 'Barde des Royaumes' },
      { level: 10, title: 'Maître Chantre' },
      { level: 20, title: 'Archimage des Mélodies' },
      { level: 50, title: 'Légende Chantée du Power' },
    ],
  },

  // ─────────────────────────────────────────────────────
  // 🕯️ DOOM METAL - Gardien du Vide
  // ─────────────────────────────────────────────────────
  void_guardian: {
    id: 'void_guardian',
    name: 'Gardien du Vide',
    icon: '🕳️',
    pillar: 'Doom Metal' as GamificationPillar,
    description: 'Ermite patient et contemplatif. Tu plonges dans les profondeurs des biographies les plus denses.',
    lore: 'Le Gardien du Vide médite dans les temples oubliés du Doom, là où le temps s\'étire à l\'infini. Il lit chaque biographie comme un parchemin sacré, cherchant la vérité dans les mots les plus denses et les plus lourds de sens.',
    color: '#475569',
    bonus: {
      type: 'biography',
      multiplier: 1.35, // +35% XP
      threshold: 500, // Biographies de plus de 500 mots
    },
    titles: [
      { level: 1, title: 'Ermite du Silence' },
      { level: 5, title: 'Gardien des Archives' },
      { level: 10, title: 'Sage du Vide' },
      { level: 20, title: 'Oracle des Profondeurs' },
      { level: 50, title: 'Maître Absolu du Doom' },
    ],
  },

  // ─────────────────────────────────────────────────────
  // 🌀 PROGRESSIVE METAL - Architecte du Chaos
  // ─────────────────────────────────────────────────────
  chaos_architect: {
    id: 'chaos_architect',
    name: 'Architecte du Chaos',
    icon: '🧩',
    pillar: 'Progressive Metal' as GamificationPillar,
    description: 'Analyste technique et maître des quiz complexes. Tu décortiques chaque structure musicale.',
    lore: 'L\'Architecte du Chaos est un esprit brillant qui déconstruit le Metal pour mieux le comprendre. Chaque signature rythmique impaire, chaque modulation complexe est un puzzle qu\'il résout avec une précision mathématique.',
    color: '#7c3aed',
    bonus: {
      type: 'quiz',
      multiplier: 1.3, // +30% XP sur les quiz
    },
    titles: [
      { level: 1, title: 'Apprenti Architecte' },
      { level: 5, title: 'Ingénieur du Son' },
      { level: 10, title: 'Maître du Chaos' },
      { level: 20, title: 'Grand Architecte du Prog' },
      { level: 50, title: 'Esprit Suprême du Progressif' },
    ],
  },

  // ─────────────────────────────────────────────────────
  // 🍀 FOLK METAL - Chaman des Racines
  // ─────────────────────────────────────────────────────
  shaman: {
    id: 'shaman',
    name: 'Chaman des Racines',
    icon: '🌿',
    pillar: 'Folk Metal' as GamificationPillar,
    description: 'Ethnographe musical et explorateur de contrées rares. Tu voyages à travers les cultures du Metal.',
    lore: 'Le Chaman des Racines parcourt le monde, collectant les mélodies ancestrales de chaque contrée. Là où les autres voient des pays exotiques, lui voit des terres promises où le Folk Metal puise sa force dans les traditions millénaires.',
    color: '#16a34a',
    bonus: {
      type: 'rare_country',
      multiplier: 1.4, // +40% XP
      threshold: 10, // Pays avec moins de 10 groupes
    },
    titles: [
      { level: 1, title: 'Voyageur Novice' },
      { level: 5, title: 'Explorateur des Terres' },
      { level: 10, title: 'Chaman des Tribus' },
      { level: 20, title: 'Gardien des Traditions' },
      { level: 50, title: 'Esprit Ancestral du Folk' },
    ],
  },

  // ─────────────────────────────────────────────────────
  // 🔗 METALCORE - Briseur de Chaînes
  // ─────────────────────────────────────────────────────
  chain_breaker: {
    id: 'chain_breaker',
    name: 'Briseur de Chaînes',
    icon: '⛓️',
    pillar: 'Metalcore' as GamificationPillar,
    description: 'Rebelle moderne et défenseur des groupes actifs. Tu soutiens la scène vivante.',
    lore: 'Le Briseur de Chaînes est un rebelle qui refuse de laisser le Metal devenir une relique du passé. Il sillonne la scène actuelle, supportant les groupes actifs qui repoussent les limites du genre et forgeant l\'avenir du Metalcore.',
    color: '#dc2626',
    bonus: {
      type: 'active_bands',
      multiplier: 1.25, // +25% XP
    },
    titles: [
      { level: 1, title: 'Rebelle Émergent' },
      { level: 5, title: 'Briseur de Chaînes' },
      { level: 10, title: 'Leader de la Révolte' },
      { level: 20, title: 'Commandant de la Scène' },
      { level: 50, title: 'Légende du Metalcore Moderne' },
    ],
  },
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Récupère les métadonnées d'une classe par son ID.
 */
export function getClassMetadata(classId: CharacterClass): ClassMetadata {
  return CHARACTER_CLASSES[classId];
}

/**
 * Récupère le titre actuel d'une classe en fonction de son niveau.
 */
export function getClassTitle(classId: CharacterClass, level: number): string {
  const classMeta = CHARACTER_CLASSES[classId];
  const titles = classMeta.titles.sort((a, b) => b.level - a.level);
  
  for (const t of titles) {
    if (level >= t.level) return t.title;
  }
  
  return titles[titles.length - 1].title;
}

/**
 * Calcule l'XP requis pour atteindre le prochain niveau de classe.
 * Progression similaire au système principal.
 */
export function getClassLevelProgress(classXp: number): {
  currentLevel: number;
  nextLevelXp: number;
  progress: number;
} {
  let level = 1;
  let xpNeeded = 100;
  let totalXpNeeded = 0;

  while (classXp >= totalXpNeeded + xpNeeded) {
    totalXpNeeded += xpNeeded;
    level++;
    xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
  }

  const currentLevelXp = classXp - totalXpNeeded;
  const progress = (currentLevelXp / xpNeeded) * 100;

  return {
    currentLevel: level,
    nextLevelXp: totalXpNeeded + xpNeeded,
    progress: Math.min(progress, 100),
  };
}

/**
 * Liste de toutes les classes, triées par pilier.
 */
export const ALL_CLASSES = Object.values(CHARACTER_CLASSES);
