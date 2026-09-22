import type { NotificationRarity } from '@/stores/notificationStore';

// ═══════════════════════════════════════════════════════════
// TABLES DU SAVOIR (centralisées pour éviter la duplication)
// ═══════════════════════════════════════════════════════════
export const TIMELINE_TABLES: Record<string, {
  ids: number[];
  icon: string;
  color: string;
}> = {
  'Heavy Metal':        { ids: [1, 2, 3, 4, 5, 6, 7],                                          icon: '🎸', color: '#8b0000' },
  'Thrash Metal':       { ids: [8, 9, 10, 11, 12, 47, 48, 49, 50, 70, 71],                     icon: '⚡', color: '#d63031' },
  'Death Metal':        { ids: [13, 14, 15, 16, 43, 44, 45, 51, 52, 72, 73],                   icon: '🩸', color: '#2d3436' },
  'Black Metal':        { ids: [17, 18, 19, 20, 21, 54, 55, 56, 74, 75],                       icon: '💀', color: '#000000' },
  'Power Metal':        { ids: [22, 23, 24, 25, 57, 58, 59, 76, 77],                           icon: '🔥', color: '#e17055' },
  'Doom Metal':         { ids: [36, 37, 38, 39, 60, 78, 79],                                   icon: '🧟', color: '#636e72' },
  'Progressive Metal':  { ids: [31, 32, 33, 62, 63, 64, 82, 83],                               icon: '🌀', color: '#00b894' },
  'Folk Metal':         { ids: [40, 41, 42, 61, 80, 81, 86],                                   icon: '🍀', color: '#27ae60' },
  'Metalcore':          { ids: [26, 27, 28, 29, 30, 65, 66, 67, 84, 85],                       icon: '💥', color: '#6c5ce7' },
};

export const TOTAL_FRAGMENTS = 85;

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
export type BadgeCategory = 'progress' | 'pillar';

export interface TimelineBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: NotificationRarity;
  category: BadgeCategory;
  pillar?: string; // défini uniquement pour les badges de pilier
  condition: (collectedIds: number[]) => boolean;
}

// ═══════════════════════════════════════════════════════════
// HELPERS DE CONDITION
// ═══════════════════════════════════════════════════════════
const hasCount = (collectedIds: number[], count: number) =>
  collectedIds.length >= count;

const hasTable = (collectedIds: number[], pillar: string) => {
  const table = TIMELINE_TABLES[pillar];
  if (!table) return false;
  return table.ids.every((id) => collectedIds.includes(id));
};

const hasAllTables = (collectedIds: number[]) =>
  Object.values(TIMELINE_TABLES).every((table) =>
    table.ids.every((id) => collectedIds.includes(id))
  );

// ═══════════════════════════════════════════════════════════
// DÉFINITION DES 14 BADGES
// ═══════════════════════════════════════════════════════════
export const TIMELINE_BADGES: TimelineBadge[] = [
  // ─────────────────────────────────────────
  // BADGES DE PROGRESSION (5)
  // ─────────────────────────────────────────
  {
    id: 'timeline-first-step',
    title: 'Premier Pas',
    description: 'Tu as gravé ton premier fragment dans la Table du Savoir.',
    icon: '🌱',
    rarity: 'commun',
    category: 'progress',
    condition: (ids) => hasCount(ids, 1),
  },
  {
    id: 'timeline-chronicler',
    title: 'Chroniqueur',
    description: '10 fragments collectés. Les Anciens reconnaissent ta curiosité.',
    icon: '📜',
    rarity: 'rare',
    category: 'progress',
    condition: (ids) => hasCount(ids, 10),
  },
  {
    id: 'timeline-explorer',
    title: 'Explorateur du Metalverse',
    description: '25 fragments gravés. Tu arpentes les couloirs du temps.',
    icon: '🗺️',
    rarity: 'epique',
    category: 'progress',
    condition: (ids) => hasCount(ids, 25),
  },
  {
    id: 'timeline-archivist',
    title: 'Archiviste des Âges',
    description: '50 fragments. Ton savoir rivalise avec celui des Sages.',
    icon: '🏛️',
    rarity: 'epique',
    category: 'progress',
    condition: (ids) => hasCount(ids, 50),
  },
  {
    id: 'timeline-grand-sage',
    title: 'Grand Sage du Metalverse',
    description: 'Les 85 fragments gravés. Ta légende est éternelle.',
    icon: '👑',
    rarity: 'legendaire',
    category: 'progress',
    condition: hasAllTables,
  },

  // ─────────────────────────────────────────
  // BADGES DE PILIER (9)
  // ─────────────────────────────────────────
  {
    id: 'pillar-heavy',
    title: 'Érudit du Heavy Metal',
    description: 'Table du Heavy Metal complète. Le Premier Riff vit en toi.',
    icon: '🎸',
    rarity: 'legendaire',
    category: 'pillar',
    pillar: 'Heavy Metal',
    condition: (ids) => hasTable(ids, 'Heavy Metal'),
  },
  {
    id: 'pillar-thrash',
    title: 'Maître du Thrash',
    description: 'Table du Thrash Metal complète. La Baie t\'a forgé.',
    icon: '⚡',
    rarity: 'legendaire',
    category: 'pillar',
    pillar: 'Thrash Metal',
    condition: (ids) => hasTable(ids, 'Thrash Metal'),
  },
  {
    id: 'pillar-death',
    title: 'Seigneur du Death',
    description: 'Table du Death Metal complète. Les morts parlent par ta voix.',
    icon: '🩸',
    rarity: 'legendaire',
    category: 'pillar',
    pillar: 'Death Metal',
    condition: (ids) => hasTable(ids, 'Death Metal'),
  },
  {
    id: 'pillar-black',
    title: 'Hérétique du Black',
    description: 'Table du Black Metal complète. L\'hiver norvégien coule dans tes veines.',
    icon: '💀',
    rarity: 'legendaire',
    category: 'pillar',
    pillar: 'Black Metal',
    condition: (ids) => hasTable(ids, 'Black Metal'),
  },
  {
    id: 'pillar-power',
    title: 'Barde du Power',
    description: 'Table du Power Metal complète. Les dragons chantent ta gloire.',
    icon: '🔥',
    rarity: 'legendaire',
    category: 'pillar',
    pillar: 'Power Metal',
    condition: (ids) => hasTable(ids, 'Power Metal'),
  },
  {
    id: 'pillar-doom',
    title: 'Gardien du Doom',
    description: 'Table du Doom Metal complète. Tu portes le poids des siècles.',
    icon: '🧟',
    rarity: 'legendaire',
    category: 'pillar',
    pillar: 'Doom Metal',
    condition: (ids) => hasTable(ids, 'Doom Metal'),
  },
  {
    id: 'pillar-progressive',
    title: 'Architecte du Progressif',
    description: 'Table du Progressive Metal complète. Tu plies le temps.',
    icon: '🌀',
    rarity: 'legendaire',
    category: 'pillar',
    pillar: 'Progressive Metal',
    condition: (ids) => hasTable(ids, 'Progressive Metal'),
  },
  {
    id: 'pillar-folk',
    title: 'Chaman du Folk',
    description: 'Table du Folk Metal complète. Les esprits de la forêt te guident.',
    icon: '🍀',
    rarity: 'legendaire',
    category: 'pillar',
    pillar: 'Folk Metal',
    condition: (ids) => hasTable(ids, 'Folk Metal'),
  },
  {
    id: 'pillar-metalcore',
    title: 'Briseur du Metalcore',
    description: 'Table du Metalcore complète. Ta rage purifie le monde.',
    icon: '💥',
    rarity: 'legendaire',
    category: 'pillar',
    pillar: 'Metalcore',
    condition: (ids) => hasTable(ids, 'Metalcore'),
  },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
export const getBadgeById = (id: string) =>
  TIMELINE_BADGES.find((b) => b.id === id);

export const getProgressBadges = () =>
  TIMELINE_BADGES.filter((b) => b.category === 'progress');

export const getPillarBadges = () =>
  TIMELINE_BADGES.filter((b) => b.category === 'pillar');
