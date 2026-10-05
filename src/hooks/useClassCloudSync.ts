import { useEffect } from 'react';
import { useAuth } from '@/api/authApi';
import { useClassStore } from '@/stores/classStore';

export function useClassCloudSync() {
  const { data: user } = useAuth();
  const loadFromCloud = useClassStore((s) => s.loadFromCloud);

  useEffect(() => {
    console.log('⚔️ [HOOK] useClassCloudSync exécuté. Utilisateur:', user?.id ? 'Connecté' : 'Non connecté');
    if (user?.id) {
      console.log('🚀 [HOOK] Déclenchement du chargement de la classe et du Panthéon...');
      loadFromCloud();
    }
  }, [user?.id, loadFromCloud]);
}
