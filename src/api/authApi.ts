import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/supabase';

// ═══════════════════════════════════════════════════════════
// AUTHENTICATION HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Hook pour récupérer l'utilisateur actuellement connecté
 * Retourne null si non connecté
 */
export function useAuth() {
  return useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
  });
}

/**
 * Hook pour récupérer le profil d'un utilisateur
 * @param userId - ID de l'utilisateur (optionnel)
 */
export function useProfile(userId?: string | null) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
}

/**
 * Hook pour créer un nouveau compte utilisateur
 * Envoie un email de confirmation si activé dans Supabase
 */
export function useSignUp() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      username,
    }: {
      email: string;
      password: string;
      username: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth-user'] });
    },
  });
}

/**
 * Hook pour se connecter avec email et mot de passe
 */
export function useSignIn() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth-user'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/**
 * Hook pour se déconnecter
 */
export function useSignOut() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => supabase.auth.signOut(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth-user'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.clear();
    },
  });
}

/**
 * Hook pour envoyer un email de réinitialisation de mot de passe
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    },
  });
}

// ═══════════════════════════════════════════════════════════
// GAMIFICATION SYNC HOOKS
// ═══════════════════════════════════════════════════════════

/**
 * Hook pour synchroniser la progression gamification avec Supabase
 * Utilisé pour persister l'XP, le niveau, les badges et quêtes dans le cloud
 * 
 * ✅ Les types Supabase sont maintenant parfaitement alignés avec le schéma DB,
 * aucun cast explicite n'est nécessaire.
 */
export function useSyncGamification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      stats,
    }: {
      userId: string;
      stats: {
        totalXP: number;
        level: number;
        totalViews: number;
        totalFavorites: number;
        totalReviews: number;
        genresExplored: string[];
        questsCompleted: string[];
        badgesUnlocked: string[];
      };
    }) => {
      const { error } = await supabase
        .from('gamification_progress')
        .upsert({
          user_id: userId,
          total_xp: stats.totalXP,
          level: stats.level,
          total_views: stats.totalViews,
          total_favorites: stats.totalFavorites,
          total_reviews: stats.totalReviews,
          genres_explored: stats.genresExplored,
          quests_completed: stats.questsCompleted,
          badges_unlocked: stats.badgesUnlocked,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}
