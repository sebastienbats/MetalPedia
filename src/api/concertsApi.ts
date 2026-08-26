import { useQuery } from '@tanstack/react-query';
import type { Concert } from '@/types/api';

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════
// Remplacez par votre vraie clé API (ex: Songkick) si vous en avez une
const API_KEY = process.env.NEXT_PUBLIC_SONGKICK_API_KEY || '';
const BASE_URL = 'https://api.songkick.com/api/3.0';

// ═══════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════

/**
 * Filtre les concerts pour ne garder que les événements à venir
 * ✅ CORRECTION : Gère le cas où 'datetime' est undefined
 */
export function filterUpcomingConcerts(concerts: Concert[]): Concert[] {
  const now = new Date();
  
  return concerts.filter((concert) => {
    // Utilise 'datetime' s'il existe, sinon fallback sur 'date' (qui est toujours une string)
    const dateStr = concert.datetime ?? concert.date;
    const concertDate = new Date(dateStr);
    
    return concertDate > now;
  });
}

/**
 * Formate une date de concert pour un affichage lisible en français
 */
export function formatConcertDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formate l'heure d'un concert (si disponible)
 */
export function formatConcertTime(datetimeString?: string): string {
  if (!datetimeString) return '';
  
  return new Date(datetimeString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ═══════════════════════════════════════════════════════════
// HOOKS REACT QUERY
// ═══════════════════════════════════════════════════════════

/**
 * Hook pour récupérer tous les concerts d'un groupe spécifique
 * (À adapter selon votre vraie source de données : Songkick, Bandsintown, etc.)
 */
export function useBandConcerts(bandId: number, bandName: string) {
  return useQuery({
    queryKey: ['concerts', 'band', bandId],
    queryFn: async (): Promise<Concert[]> => {
      // ⚠️ NOTE : Si vous n'avez pas encore configuré d'API de concerts,
      // cette fonction peut retourner un tableau vide ou des données mockées.
      
      if (!API_KEY) {
        console.warn('Clé API de concerts manquante. Retourne un tableau vide.');
        return [];
      }

      try {
        // Exemple d'appel API (à adapter selon votre fournisseur) :
        // const response = await fetch(`${BASE_URL}/artists/${bandId}/calendar.json?apikey=${API_KEY}`);
        // const data = await response.json();
        // return mapExternalApiToConcerts(data.resultsPage.results.event, bandId, bandName);
        
        // Fallback sécurisé pour le développement
        return [];
      } catch (error) {
        console.error(`Erreur lors de la récupération des concerts pour ${bandName}:`, error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 heures (les concerts ne changent pas à la seconde)
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 jours en cache
  });
}

/**
 * Hook pour récupérer uniquement les concerts À VENIR d'un groupe
 */
export function useUpcomingBandConcerts(bandId: number, bandName: string) {
  const { data: allConcerts, isLoading, error } = useBandConcerts(bandId, bandName);

  // Filtrage sécurisé côté client
  const upcomingConcerts = allConcerts ? filterUpcomingConcerts(allConcerts) : [];

  return {
    data: upcomingConcerts,
    isLoading,
    error,
  };
}

/**
 * Hook pour récupérer les concerts d'un utilisateur (si vous avez cette fonctionnalité)
 */
export function useUserConcerts(userId: string) {
  return useQuery({
    queryKey: ['concerts', 'user', userId],
    queryFn: async (): Promise<Concert[]> => {
      // Implémentation à venir : récupérer les concerts des groupes favoris de l'utilisateur
      return [];
    },
    enabled: !!userId,
  });
}
