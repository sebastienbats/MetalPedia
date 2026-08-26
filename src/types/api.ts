// src/types/api.ts

/**
 * Liste des genres principaux du metal.
 * Le fallback `| string` permet d'accepter n'importe quel genre venant de la base de données.
 */
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
  formed: number | null; // ✅ Correspond à la colonne INTEGER de Supabase
  status?: string;
  image_url?: string | null;
}

export interface Band extends BandSearchResult {
  biography: string | null;
}

/**
 * ✅ ALIAS AJOUTÉ : Pour la compatibilité avec src/api/hooks.ts et d'autres composants
 */
export type BandDetail = Band;

export interface Album {
  id: number;
  band_id: number;
  title: string;
  year: number | null;
  type: 'Studio' | 'Live' | 'EP' | 'Demo' | 'Compilation';
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
  datetime?: string; // ✅ Géré avec ?? dans concertsApi.ts
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
