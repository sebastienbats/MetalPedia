// ═══════════════════════════════════════════════════════════
// 1. GENRES & PILIERS DE GAMIFICATION
// ═══════════════════════════════════════════════════════════

// Les 9 piliers stricts utilisés pour la gamification et la navigation
export const GAMIFICATION_PILLARS = [
  'Black Metal',
  'Death Metal',
  'Heavy Metal',
  'Thrash Metal',
  'Power Metal',
  'Doom Metal',
  'Progressive Metal',
  'Folk Metal',
  'Metalcore'
] as const;

export type GamificationPillar = typeof GAMIFICATION_PILLARS[number];

// Le genre original (sous-genre Last.fm, flexible pour l'affichage)
export type Genre = string;

// Métadonnées pour l'affichage des piliers (icônes, couleurs, descriptions)
export const PILLAR_METADATA: Record<GamificationPillar, {
  icon: string;
  color: string;
  description: string;
}> = {
  'Black Metal': {
    icon: '💀',
    color: '#4a148c',
    description: 'Ténèbres, blast beats et atmosphères glaciales',
  },
  'Death Metal': {
    icon: '🩸',
    color: '#8b0000',
    description: 'Riffs brutaux, growls et violence sonore',
  },
  'Heavy Metal': {
    icon: '🎸',
    color: '#c9a227',
    description: 'Le pilier originel, riffs légendaires',
  },
  'Thrash Metal': {
    icon: '⚡',
    color: '#ff6f00',
    description: 'Vitesse, agressivité et précision technique',
  },
  'Power Metal': {
    icon: '🔥',
    color: '#d63031',
    description: 'Mélodies épiques et chants puissants',
  },
  'Doom Metal': {
    icon: '🌑',
    color: '#2d3436',
    description: 'Lenteur, lourdeur et atmosphères oppressantes',
  },
  'Progressive Metal': {
    icon: '🌀',
    color: '#0277bd',
    description: 'Complexité technique et structures élaborées',
  },
  'Folk Metal': {
    icon: '🍀',
    color: '#2e7d32',
    description: 'Traditions, légendes et instruments ancestraux',
  },
  'Metalcore': {
    icon: '💥',
    color: '#6a1b9a',
    description: 'Fusion metal/hardcore, breakdowns dévastateurs',
  },
};

// ═══════════════════════════════════════════════════════════
// 2. TYPES UTILITAIRES & ÉNUMÉRATIONS
// ═══════════════════════════════════════════════════════════

export type BioLang = 'fr' | 'en' | 'de' | 'es' | 'it' | 'pl' | 'pt' | 'ru' | 'sv' | 'ja' | 'zh' | 'none';

export type BandStatus = 'Active' | 'On hold' | 'Split-up' | 'Unknown' | 'Changed name' | 'Disputed' | 'Vacation';

export type CountrySource = 'musicbrainz' | 'lastfm_tags' | 'unknown';

export type FormedSource = 'musicbrainz' | 'unknown';

// Source des données (pour traçabilité)
export type DataSource = 'lastfm' | 'musicbrainz' | 'discogs' | 'metal_archives' | 'wikipedia' | 'commons' | 'unknown';

// ═══════════════════════════════════════════════════════════
// 3. INTERFACES PRINCIPALES (GROUPES)
// ═══════════════════════════════════════════════════════════

// Version légère pour les listes et la recherche
export interface BandSearchResult {
  id: number;
  name: string;
  genre: Genre;
  genre_pillar?: GamificationPillar | string | null;
  country: string;
  formed?: number | null;
  status?: BandStatus | string;
  image_url?: string | null;
}

// Version complète pour les fiches détaillées
// ✅ Alignée avec la table Supabase `bands` (supabase gen types)
export interface Band extends BandSearchResult {
  biography: string | null;

  // Champs enrichis via Last.fm
  bio_lang?: BioLang | null;
  listeners?: number | null;
  source_tag?: string | null;
  fetched_at?: string | null;
  original_name?: string | null;

  // Champs enrichis via MusicBrainz
  mbid?: string | null;
  country_source?: CountrySource;
  formed_source?: FormedSource;

  // 🆕 Dates précises (DB bands)
  formed_date?: string | null;
  disbanded_date?: string | null;

  // 🆕 Discogs (DB bands)
  discogs_id?: number | null;
  discogs_uri?: string | null;

  // 🆕 Système de notation communautaire (DB bands)
  rating?: number | null;
  rating_votes?: number | null;

  // 🆕 Traçabilité des sources (DB bands)
  albums_source?: DataSource | string | null;
  genre_source?: DataSource | string | null;
  image_source?: DataSource | string | null;

  // 🆕 Timestamps DB
  created_at?: string | null;
  updated_at?: string | null;

  // Relations optionnelles (chargées sur la fiche détaillée)
  albums?: Album[];
  members?: BandMember[];
}

export type BandDetail = Band;

// ═══════════════════════════════════════════════════════════
// 4. ENTITÉS ASSOCIÉES
// ═══════════════════════════════════════════════════════════

/**
 * Album - aligné sur la table Supabase `albums`
 *
 * ⚠️ MAPPING DEPUIS L'ANCIENNE VERSION :
 *   - `name`       → `title` (champ principal)
 *   - `releaseDate`→ retiré (utiliser `year` ou `raw_data.date`)
 *   - `type`       → `release_type`
 */
export interface Album {
  id: number;
  band_id: number;

  // Champs principaux (DB-aligned)
  title: string;
  year?: number | null;
  release_type?: string | null;  // Album, EP, Single, Demo, Live, Compilation...

  // Pochette / média
  image_url?: string | null;
  image_source?: DataSource | string | null;
  mbid?: string | null;

  // Métadonnées Last.fm
  artist?: string | null;
  playcount?: number | null;
  source?: DataSource | string;
  url?: string | null;
  uri?: string | null;

  // Données brutes Last.fm (contient les tracks, date précise, etc.)
  raw_data?: Record<string, unknown> | null;

  // Timestamps DB
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Membre de groupe - aligné sur la table Supabase `members`
 *
 * ⚠️ MAPPING DEPUIS L'ANCIENNE VERSION :
 *   - `is_current`   → `is_active` (DB: boolean | null)
 *   - `years_active` → `begin_date` + `end_date` (à formater côté UI)
 *
 * Pour afficher "années actives" dans l'UI, calculer :
 *   const yearsActive = member.begin_date && member.end_date
 *     ? `${member.begin_date} - ${member.end_date}`
 *     : member.begin_date ? `${member.begin_date} - présent` : null;
 */
export interface BandMember {
  id: number;
  band_id: number;
  name: string;
  role?: string | null;

  // Dates de présence (DB-aligned)
  begin_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;  // true = membre actuel

  // Traçabilité
  source?: DataSource | string | null;
  created_at?: string | null;
}

export type Member = BandMember;

/**
 * Concert (via Songkick ou autre API externe)
 */
export interface Concert {
  id: string;
  band_id: number;
  band_name: string;
  venue: string;
  city: string;
  country: string;
  date: string;
  datetime?: string;
  url?: string;
  status?: 'upcoming' | 'past' | 'cancelled';
}

/**
 * Recommandation (graphe de similarité)
 */
export interface Recommendation {
  band_id: number;
  name: string;
  genre: Genre;
  genre_pillar?: GamificationPillar | string | null;
  country: string;
  similarity_score: number;
  image_url?: string | null;
}

// ═══════════════════════════════════════════════════════════
// 5. TYPES POUR LA NAVIGATION PAR GENRES (Pages /genres)
// ═══════════════════════════════════════════════════════════

export interface SubgenreStats {
  name: string;
  count: number;
}

export interface GenrePillarStats {
  pillar: GamificationPillar;
  count: number;
  subgenres: SubgenreStats[];
}

// ═══════════════════════════════════════════════════════════
// 6. SYSTÈME DE CLASSES (Phase 1 - Gamification Avancée)
// ═══════════════════════════════════════════════════════════

/**
 * Les 9 classes de personnages du Metalverse.
 * Chaque classe correspond à un pilier de genre et possède un style de jeu unique.
 */
export type CharacterClass =
  | 'necromancer'       // Black Metal
  | 'executioner'       // Death Metal
  | 'paladin'           // Heavy Metal
  | 'berserker'         // Thrash Metal
  | 'bard'              // Power Metal
  | 'void_guardian'     // Doom Metal
  | 'chaos_architect'   // Progressive Metal
  | 'shaman'            // Folk Metal
  | 'chain_breaker';    // Metalcore

/**
 * Types de bonus applicables par classe.
 */
export type ClassBonusType =
  | 'low_listeners'     // Groupes peu connus
  | 'reviews'           // Écriture d'avis
  | 'all'               // Tous les gains d'XP
  | 'vintage'           // Groupes anciens (avant une année)
  | 'rare_country'      // Pays peu représentés
  | 'active_bands'      // Groupes actifs
  | 'favorites'         // Ajout de favoris
  | 'biography'         // Lecture de biographies
  | 'quiz';             // Réussite aux quiz

/**
 * Métadonnées complètes d'une classe de personnage.
 */
export interface ClassMetadata {
  id: CharacterClass;
  name: string;
  icon: string;
  pillar: GamificationPillar;
  description: string;
  lore: string;
  color: string;
  bonus: {
    type: ClassBonusType;
    multiplier: number; // ex: 1.5 = +50%
    threshold?: number; // ex: 1000 listeners, année 1990
  };
  titles: { level: number; title: string }[];
}

/**
 * Classe d'utilisateur telle que stockée en base de données.
 * ✅ Alignée avec la table Supabase `user_classes`
 */
export interface UserClass {
  id: string;
  user_id: string;
  class_id: CharacterClass;
  class_level: number;
  class_xp: number;
  chosen_at: string;
}

// ═══════════════════════════════════════════════════════════
// 7. SYSTÈME DE QUIZ (Phase gamification)
// ═══════════════════════════════════════════════════════════

/**
 * Types de questions supportées
 */
export type QuizQuestionType =
  | 'multiple_choice'    // QCM classique
  | 'true_false'         // Vrai/Faux
  | 'year_guess'         // Deviner l'année de sortie
  | 'genre_guess'        // Deviner le genre/pilier
  | 'member_identify'    // Identifier un membre
  | 'album_identify';    // Identifier un album

/**
 * Difficulté de la question (1 = facile, 5 = expert)
 */
export type QuizDifficulty = 1 | 2 | 3 | 4 | 5;

/**
 * Question de quiz - alignée sur la table Supabase `quiz_questions`
 */
export interface QuizQuestion {
  id: string;
  pillar_id: string;
  question_type: QuizQuestionType | string;
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  band_id?: number | null;
  difficulty?: QuizDifficulty | null;
  created_at?: string | null;
}

/**
 * Tentative de réponse - alignée sur la table Supabase `quiz_attempts`
 */
export interface QuizAttempt {
  id: string;
  user_id?: string | null;
  question_id?: string | null;
  user_answer: string;
  is_correct: boolean;
  xp_earned?: number | null;
  answered_at?: string | null;
}

/**
 * Résultat agrégé d'une session de quiz (côté frontend)
 */
export interface QuizSessionResult {
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  total_xp_earned: number;
  duration_seconds: number;
  pillar?: GamificationPillar | null;
}

// ═══════════════════════════════════════════════════════════
// 8. TYPES DE LA TIMELINE
// ═══════════════════════════════════════════════════════════

export interface TimelineEvent {
  id: number;
  content: string;
  start: string;
  end?: string;
  type?: 'point' | 'range';
  pillar?: GamificationPillar;
  className?: string;
  loreSnippet?: string;
}

export interface DecadeMetadata {
  year: string;
  epicTitle: string;
  period: {
    start: number;
    end: number;
  };
  narrative: string;
  keyEvent?: string;
  stats: {
    eventCount: number;
    pillars: string[];
  };
}
