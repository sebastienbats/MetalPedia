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
 * Récupère toutes les reviews d'un groupe avec les infos du profil utilisateur
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
 * Récupère toutes les reviews d'un utilisateur spécifique
 */
export function useUserReviews(userId: string | undefined) {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.byUser(userId!),
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

/**
 * Récupère une review spécifique par son ID
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
 * ✅ Parfaitement aligné avec le schéma DB (title + content)
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
          title: review.title.trim(), // 🛡️ Sécurité : évite les titres vides ou espaces
          content: review.content.trim(), // 🛡️ Sécurité : évite les contenus vides ou espaces
        })
        .select()
        .single();

      if (error) {
        console.error('[useSubmitReview] Erreur Supabase:', error);
        throw error;
      }
      return data as Review;
    },
    onSuccess: (_, variables) => {
      // Invalider le cache pour un rafraîchissement instantané de l'UI
      queryClient.invalidateQueries({
        queryKey: REVIEW_QUERY_KEYS.byBand(variables.band_id),
      });
      queryClient.invalidateQueries({
        queryKey: REVIEW_QUERY_KEYS.byUser(variables.user_id),
      });
      queryClient.invalidateQueries({
        queryKey: REVIEW_QUERY_KEYS.all,
      });
    },
  });
}

/**
 * Met à jour une review existante
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
 * Calcule la note moyenne d'un groupe (arrondie à 1 décimale)
 */
export function useBandAverageRating(bandId: number) {
  const { data: reviews, isLoading } = useBandReviews(bandId);

  const averageRating = reviews && reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  return {
    averageRating,
    reviewCount: reviews?.length || 0,
    isLoading,
  };
}
