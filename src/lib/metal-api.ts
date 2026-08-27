import { supabase } from '@/lib/supabase';
import type { Band, Genre, BioLang, BandStatus, CountrySource, FormedSource } from '@/types/api';

// ═══════════════════════════════════════════════════════════
// TYPE CUSTOM POUR LA TABLE BANDS
// ═══════════════════════════════════════════════════════════

type BandRow = {
  id: number;
  name: string;
  genre: string;
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
  // 🆕 Nouveaux champs MusicBrainz
  mbid: string | null;
  country_source: string | null;
  formed_source: string | null;
};

// ═══════════════════════════════════════════════════════════
// API DES GROUPES
// ═══════════════════════════════════════════════════════════

export const metalServerApi = {
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

  // 🆕 Récupère les groupes avec pays vérifié via MusicBrainz
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
    id: row.id,
    name: row.name,
    genre: (row.genre || 'Metal') as Genre,
    country: row.country || 'Unknown',
    formed: row.formed,
    status: (row.status || 'Unknown') as BandStatus,
    biography: row.biography,
    image_url: row.image_url,
    // Champs Last.fm
    bio_lang: (row.bio_lang || null) as BioLang | null,
    listeners: row.listeners || 0,
    source_tag: row.source_tag,
    fetched_at: row.fetched_at,
    original_name: row.original_name,
    // 🆕 Champs MusicBrainz
    mbid: row.mbid,
    country_source: (row.country_source || 'unknown') as CountrySource,
    formed_source: (row.formed_source || 'unknown') as FormedSource,
  };
}
