import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/supabase';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useStatsStore } from '@/stores/statsStore'; // ✅ NOUVEAU
import { useFragmentStore } from '@/stores/fragmentStore'; // ✅ NOUVEAU

// ... (useAuth, useProfile, useSignUp, useSignIn restent inchangés) ...

export function useSignOut() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => supabase.auth.signOut({ scope: 'global' }),
    onSuccess: () => {
      // ✅ 1. Réinitialiser la gamification
      useGamificationStore.setState({
        stats: {
          totalViews: 0, totalFavorites: 0, totalReviews: 0,
          genresExplored: [], pillarVisits: {}, questsCompleted: [], badgesUnlocked: [],
          totalXP: 0, level: 1, lastDailyBonus: null, trialsCompleted: 0,
        },
        xpHistory: [],
      });

      // ✅ 2. Vider les favoris locaux
      useFavoritesStore.getState().clearAll();
      
      // ✅ 3. Vider les stats locales (historique des vues)
      useStatsStore.getState().clearAll();
      
      // ✅ 4. Vider les fragments locaux
      useFragmentStore.getState().clearAll();
      
      // ✅ 5. Nettoyer le cache React Query
      qc.invalidateQueries({ queryKey: ['auth-user'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.clear();
    },
  });
}

// ... (useResetPassword, useSyncGamification, getCurrentUser restent inchangés) ...
