import { supabase } from '@/lib/supabase';
import type { 
  Band, 
  Genre, 
  BioLang, 
  BandStatus, 
  CountrySource, 
  FormedSource, 
  GamificationPillar, 
  GenrePillarStats 
} from '@/types/api';

// ═══════════════════════════════════════════════════════════
// TYPE CUSTOM POUR LA TABLE BANDS (Supabase → TypeScript)
// ═══════════════════════════════════════════════════════════

type BandRow = {
  id: number;
  name: string;
  genre: string;
  genre_pillar: string | null;
  country: string;
  formed: number | null;
  status: string | null;
  biography: string | null;
  image_url: string | null;
  listeners: number | null;
  source_tag: string | null;
  fetched_at: string | null;
  original_name: string | null;
  bio_lang: string | null;
  mbid: string | null;
  country_source: string | null;
  formed_source: string | null;
};

// ═══════════════════════════════════════════════════════════
// API DES GROUPES
// ═══════════════════════════════════════════════════════════

export const metalServerApi = {
  // ─────────────────────────────────────────────────────
  // REQUÊTE UNITAIRE
  // ─────────────────────────────────────────────────────
  
  async getBand(id: number): Promise<Band | null> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .eq('id', id)
      .single() as { data: BandRow | null; error: any };

    if (error || !data) {
      console.error(`Error fetching band ${id}:`, error);
      return null;
    }

    return mapRowToBand(data);
  },

  // ─────────────────────────────────────────────────────
  // RECHERCHE & FILTRES
  // ─────────────────────────────────────────────────────

  async searchBands(query: string): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(20) as { data: BandRow[] | null; error: any };

    if (error || !data) {
      console.error(`Error searching bands for "${query}":`, error);
      return [];
    }

    return data.map(mapRowToBand);
  },

  async getBandsByGenre(genre: string): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .ilike('genre', `%${genre}%`)
      .limit(20) as { data: BandRow[] | null; error: any };

    if (error || !data) {
      console.error(`Error fetching bands by genre "${genre}":`, error);
      return [];
    }

    return data.map(mapRowToBand);
  },

  async getAllBands(): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*') as { data: BandRow[] | null; error: any };

    if (error || !data) {
      console.error('Error fetching all bands:', error);
      return [];
    }

    return data.map(mapRowToBand);
  },

  // ─────────────────────────────────────────────────────
  // NAVIGATION PAR PILIERS (Gamification)
  // ─────────────────────────────────────────────────────

  /**
   * 🆕 Récupère les statistiques des 9 piliers avec leurs sous-genres.
   * Utilisé par la page /genres pour afficher les cards.
   */
  async getGenrePillarsStats(): Promise<GenrePillarStats[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('genre, genre_pillar') as { 
        data: Array<{ genre: string; genre_pillar: string }> | null; 
        error: any 
      };

    if (error || !data) {
      console.error('Error fetching genre stats:', error);
      return [];
    }

    // Grouper par pilier, puis par sous-genre
    const pillarsMap = new Map<string, Map<string, number>>();

    for (const band of data) {
      const pillar = band.genre_pillar || 'Heavy Metal';
      const genre = band.genre || 'Metal';

      if (!pillarsMap.has(pillar)) {
        pillarsMap.set(pillar, new Map());
      }

      const subgenres = pillarsMap.get(pillar)!;
      subgenres.set(genre, (subgenres.get(genre) || 0) + 1);
    }

    // Convertir en format structuré
    const result: GenrePillarStats[] = [];

    for (const [pillar, subgenresMap] of pillarsMap) {
      const subgenres = Array.from(subgenresMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const total = subgenres.reduce((sum, s) => sum + s.count, 0);

      result.push({
        pillar: pillar as GamificationPillar,
        count: total,
        subgenres,
      });
    }

    // Trier par nombre de groupes (décroissant)
    return result.sort((a, b) => b.count - a.count);
  },

  /**
   * 🆕 Récupère les groupes d'un pilier, avec filtrage optionnel par sous-genre.
   * Utilisé par la page /genres/[pillar] pour afficher la liste.
   */
  async getBandsByPillar(pillar: string, subgenre?: string): Promise<Band[]> {
    let query = (supabase as any)
      .from('bands')
      .select('*')
      .eq('genre_pillar', pillar);

    // Filtrer par sous-genre si spécifié
    if (subgenre) {
      query = query.eq('genre', subgenre);
    }

    // Trier par popularité (listeners décroissants)
    query = query.order('listeners', { ascending: false }).limit(100);

    const { data, error } = await query as { 
      data: BandRow[] | null; 
      error: any 
    };

    if (error || !data) {
      console.error(`Error fetching bands for pillar "${pillar}":`, error);
      return [];
    }

    return data.map(mapRowToBand);
  },

  // ─────────────────────────────────────────────────────
  // REQUÊTES SPÉCIALISÉES
  // ─────────────────────────────────────────────────────

  /**
   * Récupère les groupes triés par popularité (listeners)
   */
  async getTopBands(limit: number = 50): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .order('listeners', { ascending: false })
      .limit(limit) as { data: BandRow[] | null; error: any };

    if (error || !data) {
      console.error('Error fetching top bands:', error);
      return [];
    }

    return data.map(mapRowToBand);
  },

  /**
   * Récupère les groupes avec biographies en français
   */
  async getBandsWithFrenchBio(limit: number = 50): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .eq('bio_lang', 'fr')
      .order('listeners', { ascending: false })
      .limit(limit) as { data: BandRow[] | null; error: any };

    if (error || !data) {
      console.error('Error fetching bands with French bio:', error);
      return [];
    }

    return data.map(mapRowToBand);
  },

  /**
   * Récupère les groupes avec pays vérifié via MusicBrainz
   */
  async getBandsWithVerifiedCountry(limit: number = 50): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .eq('country_source', 'musicbrainz')
      .order('listeners', { ascending: false })
      .limit(limit) as { data: BandRow[] | null; error: any };

    if (error || !data) {
      console.error('Error fetching bands with verified country:', error);
      return [];
    }

    return data.map(mapRowToBand);
  },
};

// ═══════════════════════════════════════════════════════════
// MAPPER : BandRow (Supabase) → Band (TypeScript)
// ═══════════════════════════════════════════════════════════

function mapRowToBand(row: BandRow): Band {
  return {
    // Identifiants & infos de base
    id: row.id,
    name: row.name,
    genre: (row.genre || 'Metal') as Genre,
    genre_pillar: (row.genre_pillar || 'Heavy Metal') as GamificationPillar,
    country: row.country || 'Unknown',
    formed: row.formed,
    status: (row.status || 'Unknown') as BandStatus,
    
    // Contenu principal
    biography: row.biography,
    image_url: row.image_url,
    
    // Champs Last.fm
    bio_lang: (row.bio_lang || null) as BioLang | null,
    listeners: row.listeners || 0,
    source_tag: row.source_tag,
    fetched_at: row.fetched_at,
    original_name: row.original_name,
    
    // Champs MusicBrainz
    mbid: row.mbid,
    country_source: (row.country_source || 'unknown') as CountrySource,
    formed_source: (row.formed_source || 'unknown') as FormedSource,
  };
}
