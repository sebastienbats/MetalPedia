import { useEffect } from 'react';
import { useAuth } from '@/api/authApi';
import { useStatsStore } from '@/stores/statsStore';

export function useStatsCloudSync() {
  const { data: user } = useAuth();
  const loadFromCloud = useStatsStore((s) => s.loadFromCloud);

  useEffect(() => {
    console.log('📈 [HOOK] useStatsCloudSync exécuté. Utilisateur:', user?.id ? 'Connecté' : 'Non connecté');
    if (user?.id) {
      console.log('🚀 [HOOK] Déclenchement du chargement de l\'historique de vues...');
      loadFromCloud();
    }
  }, [user?.id, loadFromCloud]);
}
