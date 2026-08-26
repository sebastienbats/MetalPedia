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
 * ✅ Interface Album enrichie pour correspondre exactement à l'usage dans AlbumCard.tsx
 */
export interface Album {
  id: number;
  band_id: number;
  name?: string;          // ✅ Ajouté pour AlbumCard
  title?: string;         // Conservé pour compatibilité API
  year?: number | null;
  releaseDate?: string;   // ✅ Ajouté pour AlbumCard
  type: string;           // Assoupli en string pour éviter les conflits d'union stricts
  reviews?: number | any; // ✅ Ajouté pour AlbumCard
  image_url?: string | null;
}

export interface Member {
  name: string;
  role: string;
  years_active?: string;
}

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
