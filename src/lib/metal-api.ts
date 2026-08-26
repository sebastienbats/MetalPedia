import { supabase } from '@/lib/supabase';

// Type correspondant à la table 'bands' dans Supabase
export interface Band {
  id: number;
  name: string;
  genre: string;
  country: string;
  formed: number | null;
  status: string;
  biography: string | null;
  image_url: string | null;
}

export const metalServerApi = {
  /**
   * Récupère un groupe par son ID
   */
  async getBand(id: number): Promise<Band | null> {
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching band ${id}:`, error);
      return null;
    }
    return data as Band;
  },

  /**
   * Recherche des groupes par nom (insensible à la casse)
   */
  async searchBands(query: string): Promise<Band[]> {
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(20);

    if (error) {
      console.error(`Error searching bands for "${query}":`, error);
      return [];
    }
    return data as Band[];
  },

  /**
   * Récupère des groupes par genre
   */
  async getBandsByGenre(genre: string): Promise<Band[]> {
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .ilike('genre', `%${genre}%`)
      .limit(20);

    if (error) {
      console.error(`Error fetching bands by genre "${genre}":`, error);
      return [];
    }
    return data as Band[];
  },
};
