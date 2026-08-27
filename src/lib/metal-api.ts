import { supabase } from '@/lib/supabase';
import type { Band, Genre } from '@/types/api';

// ═══════════════════════════════════════════════════════════
// TYPE CUSTOM POUR LA TABLE BANDS
// ═══════════════════════════════════════════════════════════

/**
 * Type pour les requêtes Supabase sur la table 'bands'.
 * Contourne l'absence de la table 'bands' dans les types générés par Supabase.
 */
type BandRow = {
  id: number;
  name: string;
  genre: string;
  country: string;
  formed: number | null;
  status: string | null;
  biography: string | null;
  image_url: string | null;
  listeners?: number | null;
  source_tag?: string | null;
  fetched_at?: string | null;
  original_name?: string | null;
};

// Client Supabase casté pour inclure la table 'bands'
const bandsTable = supabase.from('bands' as any);

// ═══════════════════════════════════════════════════════════
// API DES GROUPES
// ═══════════════════════════════════════════════════════════

export const metalServerApi = {
  /**
   * Récupère un groupe par son ID
   */
  async getBand(id: number): Promise<Band | null> {
    const { data, error } = await bandsTable
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching band ${id}:`, error);
      return null;
    }

    return mapRowToBand(data as BandRow);
  },

  /**
   * Recherche des groupes par nom (insensible à la casse)
   */
  async searchBands(query: string): Promise<Band[]> {
    const { data, error } = await bandsTable
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(20);

    if (error) {
      console.error(`Error searching bands for "${query}":`, error);
      return [];
    }

    return ((data as BandRow[]) || []).map(mapRowToBand);
  },

  /**
   * Récupère des groupes par genre
   */
  async getBandsByGenre(genre: string): Promise<Band[]> {
    const { data, error } = await bandsTable
      .select('*')
      .ilike('genre', `%${genre}%`)
      .limit(20);

    if (error) {
      console.error(`Error fetching bands by genre "${genre}":`, error);
      return [];
    }

    return ((data as BandRow[]) || []).map(mapRowToBand);
  },

  /**
   * Récupère tous les groupes (pour generateStaticParams)
   */
  async getAllBands(): Promise<Band[]> {
    const { data, error } = await bandsTable.select('id, name, genre, country');

    if (error) {
      console.error('Error fetching all bands:', error);
      return [];
    }

    return ((data as BandRow[]) || []).map(mapRowToBand);
  },
};

// ═══════════════════════════════════════════════════════════
// MAPPER : BandRow (Supabase) → Band (TypeScript)
// ═══════════════════════════════════════════════════════════

function mapRowToBand(row: BandRow): Band {
  return {
    id: row.id,
    name: row.name,
    genre: (row.genre || 'Metal') as Genre,
    country: row.country || 'Unknown',
    formed: row.formed,
    status: row.status || 'Unknown',
    biography: row.biography,
    image_url: row.image_url,
  };
}
