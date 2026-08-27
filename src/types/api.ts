// src/types/api.ts

export type Genre = 
  | 'Black Metal' | 'Death Metal' | 'Heavy Metal' | 'Thrash Metal' 
  | 'Power Metal' | 'Doom Metal' | 'Progressive Metal' | 'Folk Metal' 
  | 'Symphonic Metal' | 'Gothic Metal' | 'Nu Metal' | 'Metalcore' 
  | 'Sludge Metal' | 'Stoner Metal' | 'Groove Metal'
  | string; 

export type BioLang = 'fr' | 'en' | 'de' | 'es' | 'it' | 'pl' | 'pt' | 'ru' | 'sv' | 'ja' | 'zh' | 'none';

export type BandStatus = 'Active' | 'On hold' | 'Split-up' | 'Unknown' | 'Changed name' | 'Disputed' | 'Vacation';

// 🆕 Sources de données pour le pays
export type CountrySource = 'musicbrainz' | 'lastfm_tags' | 'unknown';

// 🆕 Sources de données pour l'année de formation
export type FormedSource = 'musicbrainz' | 'unknown';

export interface BandSearchResult {
  id: number;
  name: string;
  genre: Genre;
  country: string;
  formed?: number | null;
  status?: BandStatus | string;
  image_url?: string | null;
}

export interface Band extends BandSearchResult {
  biography: string | null;
  // Champs enrichis via Last.fm
  bio_lang?: BioLang | null;
  listeners?: number | null;
  source_tag?: string | null;
  fetched_at?: string | null;
  original_name?: string | null;
  // 🆕 Champs enrichis via MusicBrainz
  mbid?: string | null;              // MusicBrainz ID
  country_source?: CountrySource;    // Source du pays
  formed_source?: FormedSource;      // Source de l'année de formation
}

export type BandDetail = Band;

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
  country: string;
  similarity_score: number;
  image_url?: string | null;
}
