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
  // REVIEWS & NOTATIONS
  // ─────────────────────────────────────────────────────

  /**
   * Récupère tous les avis d'un groupe avec la moyenne calculée.
   * Retourne également le nombre total d'avis.
   */
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

  /**
   * Ajoute un nouvel avis pour un groupe.
   * Lance une erreur si l'utilisateur a déjà laissé un avis (contrainte UNIQUE).
   */
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

  /**
   * Supprime un avis (uniquement si l'utilisateur en est l'auteur).
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId); // Double sécurité : vérification côté client ET RLS

    if (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────
  // SYSTÈME DE QUIZ (NOUVEAU)
  // ─────────────────────────────────────────────────────

  /**
   * Récupère des questions de quiz aléatoires, optionnellement filtrées par pilier.
   */
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

    // Mélange simple côté client pour garantir l'aléatoire à chaque appel
    return data.sort(() => Math.random() - 0.5);
  },

  /**
   * Enregistre une tentative de réponse au quiz dans la base de données.
   */
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
