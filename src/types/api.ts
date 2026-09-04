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

// ═══════════════════════════════════════════════════════════
// 3. INTERFACES PRINCIPALES (GROUPES)
// ═══════════════════════════════════════════════════════════

// Version légère pour les listes et la recherche
export interface BandSearchResult {
  id: number;
  name: string;
  genre: Genre;                                    // Sous-genre original (ex: "Viking Metal")
  genre_pillar?: GamificationPillar | string | null; // Pilier de gamification (ex: "Folk Metal")
  country: string;
  formed?: number | null;
  status?: BandStatus | string;
  image_url?: string | null;
}

// Version complète pour les fiches détaillées
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
}

export type BandDetail = Band;

// ═══════════════════════════════════════════════════════════
// 4. ENTITÉS ASSOCIÉES
// ═══════════════════════════════════════════════════════════

export interface Album {
  id: number;
  band_id: number;
  name?: string;
  title?: string;
  year?: number | null;
  releaseDate?: string;
  type: string;
  reviews?: number | any;
  image_url?: string | null;
}

export interface BandMember {
  name: string;
  role: string;
  years_active?: string;
  is_current?: boolean;
}

export type Member = BandMember;

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
