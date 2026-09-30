import { supabase } from '@/lib/supabase';
import type { 
  Band, 
  Album,
  BandMember,
  Genre, 
  BioLang, 
  BandStatus, 
  CountrySource, 
  FormedSource, 
  GamificationPillar, 
  GenrePillarStats,
  DataSource,
} from '@/types/api';

// ═══════════════════════════════════════════════════════════
// TYPES CUSTOMS (Supabase → TypeScript)
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
  formed_date: string | null;
  disbanded_date: string | null;
  discogs_id: number | null;
  discogs_uri: string | null;
  rating: number | null;
  rating_votes: number | null;
  albums_source: string | null;
  genre_source: string | null;
  image_source: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AlbumRow = {
  id: number;
  band_id: number;
  title: string;
  release_type: string | null;
  year: number | null;
  image_url: string | null;
  image_source: string | null;
  mbid: string | null;
  artist: string | null;
  playcount: number | null;
  source: string | null;
  url: string | null;
  uri: string | null;
  raw_data: unknown | null;
  created_at: string | null;
  updated_at: string | null;
};

type BandMemberRow = {
  id: number;
  band_id: number;
  name: string;
  role: string | null;
  begin_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  source: string | null;
  created_at: string | null;
};

export type Review = {
  id: string;
  band_id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export interface QuizQuestion {
  id: string;
  band_id: number;
  question_type: string;
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  difficulty: number;
  pillar_id: string;
  created_at: string;
}

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

    if (error || !data) return null;
    return mapRowToBand(data);
  },

  async getBandAlbums(bandId: number): Promise<Album[]> {
    const { data, error } = await (supabase as any)
      .from('albums')
      .select('*')
      .eq('band_id', bandId)
      .order('year', { ascending: false }) as { data: AlbumRow[] | null; error: any };

    if (error || !data) return [];
    return data.map(mapRowToAlbum);
  },

  async getBandMembers(bandId: number): Promise<BandMember[]> {
    const { data, error } = await (supabase as any)
      .from('members')
      .select('*')
      .eq('band_id', bandId)
      .order('is_active', { ascending: false })
      .order('role', { ascending: true }) as { data: BandMemberRow[] | null; error: any };

    if (error || !data) return [];
    return data.map(mapRowToMember);
  },

  async searchBands(query: string): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(20) as { data: BandRow[] | null; error: any };

    if (error || !data) return [];
    return data.map(mapRowToBand);
  },

  async getBandsByGenre(genre: string): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .ilike('genre', `%${genre}%`)
      .limit(20) as { data: BandRow[] | null; error: any };

    if (error || !data) return [];
    return data.map(mapRowToBand);
  },

  async getAllBands(): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*') as { data: BandRow[] | null; error: any };

    if (error || !data) return [];
    return data.map(mapRowToBand);
  },

  // ─────────────────────────────────────────────────────
  // 🛡️ CORRECTION MAJEURE : Comptage précis et inclusif
  // ─────────────────────────────────────────────────────
  async getGenrePillarsStats(): Promise<GenrePillarStats[]> {
    const pillars: GamificationPillar[] = [
      'Black Metal', 'Death Metal', 'Heavy Metal', 'Thrash Metal',
      'Power Metal', 'Doom Metal', 'Progressive Metal', 'Folk Metal', 'Metalcore'
    ];
    
    const result: GenrePillarStats[] = [];

    for (const pillar of pillars) {
      // On récupère TOUTES les lignes de ce pilier (range large pour éviter la limite PostgREST)
      const { data, error } = await (supabase as any)
        .from('bands')
        .select('genre, genre_pillar')
        .eq('genre_pillar', pillar)
        .range(0, 100000) as { 
          data: Array<{ genre: string | null; genre_pillar: string | null }> | null; 
          error: any 
        };

      if (error || !data) {
        console.error(`Error fetching stats for ${pillar}:`, error);
        continue;
      }

      const subgenresMap = new Map<string, number>();
      
      for (const band of data) {
        // ✅ Inclusif : Si le genre est null/vide, on le compte dans "Non catégorisé"
        const genre = (band.genre && band.genre.trim() !== '') ? band.genre : 'Non catégorisé';
        subgenresMap.set(genre, (subgenresMap.get(genre) || 0) + 1);
      }

      const subgenres = Array.from(subgenresMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Le total du pilier est la somme exacte de tous ses sous-genres (y compris "Non catégorisé")
      const total = subgenres.reduce((sum, s) => sum + s.count, 0);

      result.push({
        pillar,
        count: total,
        subgenres,
      });
    }

    return result.sort((a, b) => b.count - a.count);
  },

  // ─────────────────────────────────────────────────────
  // 🛡️ CORRECTION MAJEURE : Suppression du plafond de 100
  // ─────────────────────────────────────────────────────
  async getBandsByPillar(pillar: string, subgenre?: string, limit: number = 10000): Promise<Band[]> {
    let query = (supabase as any)
      .from('bands')
      .select('*')
      .eq('genre_pillar', pillar);

    if (subgenre) {
      query = query.eq('genre', subgenre);
    }

    // ✅ CORRECTION : Augmentation massive de la limite (défaut 10000) 
    // pour que {bands.length} affiche le VRAI total sur la page [pillar], et non un plafond de 100.
    query = query.order('listeners', { ascending: false }).limit(limit);

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

  async getBandReviews(bandId: number): Promise<{
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
  }> {
    const { data, error } = await (supabase as any)
      .from('reviews')
      .select('*')
      .eq('band_id', bandId)
      .order('created_at', { ascending: false }) as { data: Review[] | null; error: any };

    if (error) return { reviews: [], averageRating: 0, totalReviews: 0 };

    const reviews = data || [];
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;

    return { reviews, averageRating, totalReviews };
  },

  async addReview(bandId: number, userId: string, rating: number, comment: string): Promise<Review> {
    const { data, error } = await (supabase as any)
      .from('reviews')
      .insert({ 
        band_id: bandId, 
        user_id: userId, 
        rating, 
        comment: comment.trim() || null 
      })
      .select()
      .single() as { data: Review | null; error: any };

    if (error) throw error;
    return data!;
  },

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getQuizQuestions(pillar?: string, limit: number = 5): Promise<QuizQuestion[]> {
    let query = (supabase as any)
      .from('quiz_questions')
      .select('*')
      .limit(limit);

    if (pillar) query = query.eq('pillar_id', pillar);

    const { data, error } = await query as { data: QuizQuestion[] | null; error: any };
    if (error || !data) return [];

    return data.sort(() => Math.random() - 0.5);
  },

  async submitQuizAttempt(
    userId: string,
    questionId: string,
    userAnswer: string,
    isCorrect: boolean,
    xpEarned: number
  ): Promise<void> {
    const { error } = await (supabase as any).from('quiz_attempts').insert({
      user_id: userId,
      question_id: questionId,
      user_answer: userAnswer,
      is_correct: isCorrect,
      xp_earned: xpEarned,
    });

    if (error) throw error;
  },

  async getTopBands(limit: number = 50): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .order('listeners', { ascending: false })
      .limit(limit) as { data: BandRow[] | null; error: any };

    if (error || !data) return [];
    return data.map(mapRowToBand);
  },

  async getBandsWithFrenchBio(limit: number = 50): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .eq('bio_lang', 'fr')
      .order('listeners', { ascending: false })
      .limit(limit) as { data: BandRow[] | null; error: any };

    if (error || !data) return [];
    return data.map(mapRowToBand);
  },

  async getBandsWithVerifiedCountry(limit: number = 50): Promise<Band[]> {
    const { data, error } = await (supabase as any)
      .from('bands')
      .select('*')
      .eq('country_source', 'musicbrainz')
      .order('listeners', { ascending: false })
      .limit(limit) as { data: BandRow[] | null; error: any };

    if (error || !data) return [];
    return data.map(mapRowToBand);
  },
};

// ═══════════════════════════════════════════════════════════
// MAPPERS
// ═══════════════════════════════════════════════════════════

function mapRowToBand(row: BandRow): Band {
  return {
    id: row.id,
    name: row.name,
    genre: (row.genre || 'Metal') as Genre,
    genre_pillar: (row.genre_pillar || 'Heavy Metal') as GamificationPillar,
    country: row.country || 'Unknown',
    formed: row.formed,
    status: (row.status || 'Unknown') as BandStatus,
    biography: row.biography,
    image_url: row.image_url,
    bio_lang: (row.bio_lang || null) as BioLang | null,
    listeners: row.listeners || 0,
    source_tag: row.source_tag,
    fetched_at: row.fetched_at,
    original_name: row.original_name,
    mbid: row.mbid,
    country_source: (row.country_source || 'unknown') as CountrySource,
    formed_source: (row.formed_source || 'unknown') as FormedSource,
    formed_date: row.formed_date,
    disbanded_date: row.disbanded_date,
    discogs_id: row.discogs_id,
    discogs_uri: row.discogs_uri,
    rating: row.rating,
    rating_votes: row.rating_votes,
    albums_source: row.albums_source as DataSource | string | null,
    genre_source: row.genre_source as DataSource | string | null,
    image_source: row.image_source as DataSource | string | null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapRowToAlbum(row: AlbumRow): Album {
  return {
    id: row.id,
    band_id: row.band_id,
    title: row.title || 'Titre inconnu',
    release_type: row.release_type || 'Album',
    year: row.year,
    image_url: row.image_url || null,
    image_source: row.image_source as DataSource | string | null,
    mbid: row.mbid,
    artist: row.artist,
    playcount: row.playcount,
    source: row.source as DataSource | string | undefined,
    url: row.url,
    uri: row.uri,
    raw_data: row.raw_data as Record<string, unknown> | null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapRowToMember(row: BandMemberRow): BandMember {
  return {
    id: row.id,
    band_id: row.band_id,
    name: row.name,
    role: row.role,
    begin_date: row.begin_date,
    end_date: row.end_date,
    is_active: row.is_active,
    source: row.source as DataSource | string | null,
    created_at: row.created_at,
  };
}
