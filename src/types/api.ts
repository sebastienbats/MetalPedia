// src/types/api.ts

/**
 * Liste des genres principaux du metal.
 * Le fallback `| string` permet d'accepter n'importe quel genre venant de la base de données
 * sans faire échouer le typage TypeScript.
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

/**
 * Type pour les résultats de recherche de groupes.
 * ✅ 'formed' est maintenant 'number | null' pour correspondre à la colonne INTEGER de Supabase.
 */
export interface BandSearchResult {
  id: number;
  name: string;
  genre: Genre;
  country: string;
  formed: number | null; 
  status?: string;
  image_url?: string | null;
}

/**
 * Type complet d'un groupe (étend BandSearchResult avec la biographie)
 */
export interface Band extends BandSearchResult {
  biography: string | null;
}

/**
 * Type pour les albums
 */
export interface Album {
  id: number;
  band_id: number;
  title: string;
  year: number | null;
  type: 'Studio' | 'Live' | 'EP' | 'Demo' | 'Compilation';
}

/**
 * Type pour les membres d'un groupe
 */
export interface Member {
  name: string;
  role: string;
  years_active?: string;
}

/**
 * Type pour les concerts (ex: via Songkick ou API externe)
 */
export interface Concert {
  id: string;
  band_id: number;
  band_name: string;
  venue: string;
  city: string;
  country: string;
  date: string; // Format ISO (YYYY-MM-DD)
  url?: string;
  status?: 'upcoming' | 'past' | 'cancelled';
}

/**
 * Type pour les recommandations du moteur ML
 */
export interface Recommendation {
  band_id: number;
  name: string;
  genre: Genre;
  country: string;
  similarity_score: number;
  image_url?: string | null;
}
