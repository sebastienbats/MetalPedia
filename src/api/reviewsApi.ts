import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Review, ReviewWithAuthor } from '@/types/supabase';

// ═══════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════

export const REVIEW_QUERY_KEYS = {
  all: ['reviews'] as const,
  byBand: (bandId: number) => ['reviews', 'band', bandId] as const,
  byUser: (userId: string) => ['reviews', 'user', userId] as const,
  byId: (reviewId: string) => ['reviews', 'id', reviewId] as const,
};

// ═══════════════════════════════════════════════════════════
// HOOKS DE LECTURE
// ═══════════════════════════════════════════════════════════

/**
 * Récupère toutes les reviews d'un groupe
 */
export function useBandReviews(bandId: number) {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.byBand(bandId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:profiles (
            username,
            avatar_url
          )
        `)
        .eq('band_id', bandId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReviewWithAuthor[];
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Récupère toutes les reviews d'un utilisateur
 */
export function useUserReviews(userId: string | undefined) {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.byUser(userId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

/**
 * Récupère une review spécifique
 */
export function useReview(reviewId: string | undefined) {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.byId(reviewId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:profiles (
            username,
            avatar_url
          )
        `)
        .eq('id', reviewId!)
        .single();

      if (error) throw error;
      return data as ReviewWithAuthor;
    },
    enabled: !!reviewId,
  });
}

// ═══════════════════════════════════════════════════════════
// HOOKS DE MUTATION
// ═══════════════════════════════════════════════════════════

/**
 * Soumet une nouvelle review
 * 
 * ✅ Les types Supabase sont maintenant parfaitement alignés avec le schéma DB,
 * aucun cast explicite n'est nécessaire.
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      user_id: string;
      band_id: number;
      album_id?: number | null;
      rating: number;
      title: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: review.user_id,
          band_id: review.band_id,
          album_id: review.album_id ?? null,
          rating: review.rating,
          title: review.title,
          content: review.content,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Review;
    },
    onSuccess: (_, variables) => {
      // Invalider le cache des reviews du groupe
      queryClient.invalidateQueries({
        queryKey: REVIEW_QUERY_KEYS.byBand(variables.band_id),
      });
      // Invalider les reviews de l'utilisateur
      queryClient.invalidateQueries({
        queryKey: REVIEW_QUERY_KEYS.byUser(variables.user_id),
      });
    },
  });
}

/**
 * Met à jour une review existante
 * 
 * ✅ Les types Supabase sont maintenant parfaitement alignés avec le schéma DB,
 * aucun cast explicite n'est nécessaire.
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      ...updates
    }: {
      reviewId: string;
      rating?: number;
      title?: string;
      content?: string;
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data as Review;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: REVIEW_QUERY_KEYS.byBand(data.band_id),
      });
      queryClient.invalidateQueries({
        queryKey: REVIEW_QUERY_KEYS.byId(data.id),
      });
    },
  });
}

/**
 * Supprime une review
 * 
 * ✅ Les types Supabase sont maintenant parfaitement alignés avec le schéma DB,
 * aucun cast explicite n'est nécessaire.
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalider toutes les reviews (on ne connaît pas le band_id)
      queryClient.invalidateQueries({
        queryKey: REVIEW_QUERY_KEYS.all,
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════
// HOOKS UTILITAIRES
// ═══════════════════════════════════════════════════════════

/**
 * Calcule la note moyenne d'un groupe
 */
export function useBandAverageRating(bandId: number) {
  const { data: reviews, isLoading } = useBandReviews(bandId);

  const averageRating = reviews && reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : null;

  return {
    averageRating,
    reviewCount: reviews?.length || 0,
    isLoading,
  };
}
