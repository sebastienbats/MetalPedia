import { supabase } from '@/lib/supabase';
import type { Genre } from '@/types/api'; // Assurez-vous que ce chemin correspond à votre fichier de types

export interface Band {
  id: number;
  name: string;
  genre: Genre; // On force le type strict ici
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
    
    // On dit à TypeScript que les données de Supabase correspondent à notre interface Band
    return data as unknown as Band;
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
    
    return data as unknown as Band[];
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
    
    return data as unknown as Band[];
  },
};
