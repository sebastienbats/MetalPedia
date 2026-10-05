import { useEffect } from 'react';
import { useAuth } from '@/api/authApi';
import { useFragmentStore } from '@/stores/fragmentStore';

export function useFragmentCloudSync() {
  const { data: user } = useAuth();
  const loadFromCloud = useFragmentStore((s) => s.loadFromCloud);

  useEffect(() => {
    console.log('📜 [HOOK] useFragmentCloudSync exécuté. Utilisateur:', user?.id ? 'Connecté' : 'Non connecté');
    if (user?.id) {
      console.log('🚀 [HOOK] Déclenchement du chargement des fragments de la Timeline...');
      loadFromCloud();
    }
  }, [user?.id, loadFromCloud]);
}
