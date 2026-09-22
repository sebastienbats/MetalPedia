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
  GenrePillarStats 
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
};

type AlbumRow = {
  id: number;
  band_id: number;
  name: string;
  title?: string;
  type: string;
  year?: number | null;
  release_date?: string | null;
  image_url?: string | null;
};

// ✅ Structure réelle de la table 'members'
type BandMemberRow = {
  id: number;
  band_id: number;
  name: string;
  role: string;
  source?: string | null;
  created_at?: string | null;
  begin_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
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

  // ═══════════════════════════════════════════════════════════
  // 🆕 ALBUMS & MEMBRES
  // ═══════════════════════════════════════════════════════════

  /**
   * 🆕 Récupère tous les albums d'un groupe, triés par année (décroissant)
   */
  async getBandAlbums(bandId: number): Promise<Album[]> {
    const { data, error } = await (supabase as any)
      .from('albums')
      .select('*')
      .eq('band_id', bandId)
      .order('year', { ascending: false }) as { 
        data: AlbumRow[] | null; 
        error: any 
      };

    if (error || !data) {
      console.error(`Error fetching albums for band ${bandId}:`, error);
      return [];
    }

    return data.map(mapRowToAlbum);
  },

  /**
   * 🆕 Récupère tous les membres d'un groupe depuis la table 'members'
   * Triés : membres actifs d'abord, puis par rôle
   */
  async getBandMembers(bandId: number): Promise<BandMember[]> {
    const { data, error } = await (supabase as any)
      .from('members')  // ✅ Nom réel de la table
      .select('*')
      .eq('band_id', bandId)
      .order('is_active', { ascending: false })  // ✅ is_active au lieu de is_current
      .order('role', { ascending: true }) as { 
        data: BandMemberRow[] | null; 
        error: any 
      };

    if (error || !data) {
      console.error(`Error fetching members for band ${bandId}:`, error);
      return [];
    }

    return data.map(mapRowToMember);
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

    return result.sort((a, b) => b.count - a.count);
  },

  async getBandsByPillar(pillar: string, subgenre?: string): Promise<Band[]> {
    let query = (supabase as any)
      .from('bands')
      .select('*')
      .eq('genre_pillar', pillar);

    if (subgenre) {
      query = query.eq('genre', subgenre);
    }

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
  // REVIEWS & NOTATIONS
  // ─────────────────────────────────────────────────────

  async getBandReviews(bandId: number): Promise<{
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
  }> {
    const { data, error } = await (supabase as any)
      .from('reviews')
      .select('*')
      .eq('band_id', bandId)
      .order('created_at', { ascending: false }) as { 
        data: Review[] | null; 
        error: any 
      };

    if (error) {
      console.error('Error fetching reviews:', error);
      return { reviews: [], averageRating: 0, totalReviews: 0 };
    }

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

    if (error) {
      console.error('Error adding review:', error);
      throw error;
    }

    return data!;
  },

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────
  // SYSTÈME DE QUIZ
  // ─────────────────────────────────────────────────────

  async getQuizQuestions(pillar?: string, limit: number = 5): Promise<QuizQuestion[]> {
    let query = (supabase as any)
      .from('quiz_questions')
      .select('*')
      .limit(limit);

    if (pillar) {
      query = query.eq('pillar_id', pillar);
    }

    const { data, error } = await query as { data: QuizQuestion[] | null; error: any };

    if (error || !data) {
      console.error('Error fetching quiz questions:', error);
      return [];
    }

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

    if (error) {
      console.error('Error submitting quiz attempt:', error);
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────
  // REQUÊTES SPÉCIALISÉES
  // ─────────────────────────────────────────────────────

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
  };
}

// ✅ MAPPER ALBUM : avec id et band_id
function mapRowToAlbum(row: AlbumRow): Album {
  return {
    id: row.id,
    band_id: row.band_id,
    name: row.name,
    title: row.title || row.name,
    type: row.type || 'Album',
    year: row.year,
    release_date: row.release_date,
    releaseDate: row.release_date || (row.year ? String(row.year) : undefined),
    image_url: row.image_url || null,
  };
}

// ✅ MAPPER BANDMEMBER : conversion DB → Frontend
function mapRowToMember(row: BandMemberRow): BandMember {
  // Construire years_active depuis begin_date et end_date
  let years_active: string | undefined = undefined;
  
  if (row.begin_date) {
    if (row.is_active) {
      years_active = `${row.begin_date} - Présent`;
    } else if (row.end_date) {
      years_active = `${row.begin_date} - ${row.end_date}`;
    } else {
      years_active = row.begin_date;
    }
  } else if (row.end_date) {
    years_active = `Jusqu'en ${row.end_date}`;
  }

  return {
    id: row.id,
    band_id: row.band_id,
    name: row.name,
    role: row.role,
    years_active,
    is_current: row.is_active ?? false,  // ✅ is_active → is_current
  };
}
