import { useEffect } from 'react';
import { useAuth } from '@/api/authApi';
import { useGamificationStore } from '@/stores/gamificationStore';

export function useGamificationCloudSync() {
  const { data: user } = useAuth();
  const loadFromCloud = useGamificationStore((s) => s.loadFromCloud);

  useEffect(() => {
    console.log('📊 [HOOK] useGamificationCloudSync exécuté. Utilisateur:', user?.id ? 'Connecté' : 'Non connecté');
    if (user?.id) {
      console.log('🚀 [HOOK] Déclenchement du chargement des stats de gamification...');
      loadFromCloud();
    }
  }, [user?.id, loadFromCloud]);
}
