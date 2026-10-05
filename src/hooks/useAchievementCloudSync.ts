import { useEffect } from 'react';
import { useAuth } from '@/api/authApi';
import { useAchievementStore } from '@/stores/achievementStore';

export function useAchievementCloudSync() {
  const { data: user } = useAuth();
  const loadFromCloud = useAchievementStore((s) => s.loadFromCloud);

  useEffect(() => {
    console.log('🏆 [HOOK] useAchievementCloudSync exécuté. Utilisateur:', user?.id ? 'Connecté' : 'Non connecté');
    if (user?.id) {
      console.log('🚀 [HOOK] Déclenchement du chargement des badges et achievements...');
      loadFromCloud();
    }
  }, [user?.id, loadFromCloud]);
}
