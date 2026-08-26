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
 * ✅ 'formed' est maintenant 'number | null' pour correspondre à Supabase.
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

// ═══════════════════════════════════════════
// AUTRES TYPES DE L'API (si vous en avez)
// ═══════════════════════════════════════════

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
