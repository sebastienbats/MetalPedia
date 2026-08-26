// src/types/api.ts

export type Genre = 
  | 'Black Metal' 
  | 'Death Metal' 
  | 'Heavy Metal' 
  | 'Thrash Metal' 
  | 'Power Metal' 
  | 'Doom Metal' 
  | 'Progressive Metal' 
  | 'Folk Metal' 
  | 'Symphonic Metal' 
  | 'Gothic Metal' 
  | 'Nu Metal' 
  | 'Metalcore' 
  | 'Sludge Metal' 
  | 'Stoner Metal' 
  | 'Groove Metal'
  | string; 

export interface BandSearchResult {
  id: number;
  name: string;
  genre: Genre;
  country: string;
  formed: number | null;
  status?: string;
  image_url?: string | null;
}

export interface Band extends BandSearchResult {
  biography: string | null;
}

export type BandDetail = Band;

/**
 * ✅ Interface Album enrichie pour correspondre à l'usage dans AlbumCard.tsx
 */
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

/**
 * ✅ Interface BandMember (alias Member pour compatibilité)
 */
export interface BandMember {
  name: string;
  role: string;
  years_active?: string;
  is_current?: boolean;
}

export type Member = BandMember; // Alias pour éviter de casser d'autres imports

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
