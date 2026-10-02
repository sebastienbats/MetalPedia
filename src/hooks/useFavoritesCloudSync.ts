import { useEffect } from 'react';
import { useAuth } from '@/api/authApi';
import { useFavoritesStore } from '@/stores/favoritesStore';

export function useFavoritesCloudSync() {
  const { data: user } = useAuth();
  const loadFromCloud = useFavoritesStore((s) => s.loadFromCloud);

  useEffect(() => {
    console.log('🔄 [HOOK] useFavoritesCloudSync exécuté. Utilisateur:', user?.id ? 'Connecté' : 'Non connecté');
    if (user?.id) {
      console.log('🚀 [HOOK] Déclenchement de loadFromCloud...');
      loadFromCloud();
    }
  }, [user?.id, loadFromCloud]);
}
