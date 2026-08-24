import { useQuery } from '@tanstack/react-query';
import type { Concert } from '@/types/api';

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════

const SONGKICK_API_KEY = process.env.NEXT_PUBLIC_SONGKICK_API_KEY;
const SONGKICK_BASE_URL = 'https://api.songkick.com/api/3.0';

// Cache : 6 heures pour les concerts
const CONCERTS_STALE_TIME = 6 * 60 * 60 * 1000;
const CONCERTS_GC_TIME = 24 * 60 * 60 * 1000;

// ═══════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════

export const CONCERTS_QUERY_KEYS = {
  all: ['concerts'] as const,
  byBand: (bandName: string) => ['concerts', 'band', bandName] as const,
  byLocation: (location: string) => ['concerts', 'location', location] as const,
};

// ═══════════════════════════════════════════
// FONCTIONS API
// ═══════════════════════════════════════════

/**
 * Recherche un artiste sur Songkick par nom
 */
async function searchArtist(bandName: string): Promise<string | null> {
  if (!SONGKICK_API_KEY) {
    console.warn('⚠️ SONGKICK_API_KEY non configurée');
    return null;
  }

  try {
    const response = await fetch(
      `${SONGKICK_BASE_URL}/search/artists.json?query=${encodeURIComponent(bandName)}&apikey=${SONGKICK_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Songkick search error: ${response.status}`);
    }

    const data = await response.json();
    const artists = data?.resultsPage?.results?.artist || [];

    if (artists.length === 0) return null;

    // Prendre le premier résultat (le plus pertinent)
    return artists[0].id;
  } catch (error) {
    console.error('Erreur recherche artiste Songkick:', error);
    return null;
  }
}

/**
 * Récupère les concerts à venir d'un artiste
 */
async function fetchArtistConcerts(artistId: string): Promise<Concert[]> {
  try {
    const response = await fetch(
      `${SONGKICK_BASE_URL}/artists/${artistId}/calendar.json?apikey=${SONGKICK_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Songkick calendar error: ${response.status}`);
    }

    const data = await response.json();
    const events = data?.resultsPage?.results?.event || [];

    // Transformer au format Concert
    return events.map((event: any) => ({
      id: String(event.id),
      displayName: event.displayName || 'Concert',
      datetime: event.start?.dateTime || event.start?.date,
      venue: {
        displayName: event.venue?.displayName || 'Lieu inconnu',
        city: event.location?.city || '',
        country: event.location?.country || '',
        lat: event.location?.lat,
        lng: event.location?.lng,
      },
      artists: (event.performance || []).map((p: any) => ({
        displayName: p.displayName,
      })),
      uri: event.uri,
      popularity: event.popularity,
    }));
  } catch (error) {
    console.error('Erreur récupération concerts:', error);
    return [];
  }
}

/**
 * Pipeline complet : nom de groupe → concerts
 */
async function getBandConcerts(bandName: string): Promise<Concert[]> {
  // Étape 1 : Rechercher l'artiste
  const artistId = await searchArtist(bandName);

  if (!artistId) {
    return [];
  }

  // Étape 2 : Récupérer les concerts
  const concerts = await fetchArtistConcerts(artistId);

  // Étape 3 : Filtrer uniquement les concerts futurs
  const now = new Date();
  return concerts.filter((concert) => {
    const concertDate = new Date(concert.datetime);
    return concertDate > now;
  });
}

// ═══════════════════════════════════════════
// HOOKS REACT QUERY
// ═══════════════════════════════════════════

/**
 * Hook principal : concerts à venir d'un groupe
 */
export function useBandConcerts(bandName: string | undefined) {
  return useQuery({
    queryKey: CONCERTS_QUERY_KEYS.byBand(bandName!),
    queryFn: () => getBandConcerts(bandName!),
    enabled: !!bandName && !!SONGKICK_API_KEY,
    staleTime: CONCERTS_STALE_TIME,
    gcTime: CONCERTS_GC_TIME,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook : concerts par localisation
 */
export function useConcertsByLocation(
  lat: number | undefined,
  lng: number | undefined
) {
  return useQuery({
    queryKey: CONCERTS_QUERY_KEYS.byLocation(`${lat},${lng}`),
    queryFn: async () => {
      if (!SONGKICK_API_KEY || !lat || !lng) return [];

      try {
        const response = await fetch(
          `${SONGKICK_BASE_URL}/events.json?location=geo:${lat},${lng}&apikey=${SONGKICK_API_KEY}`
        );

        if (!response.ok) throw new Error('Location concerts error');

        const data = await response.json();
        return data?.resultsPage?.results?.event || [];
      } catch (error) {
        console.error('Erreur concerts par localisation:', error);
        return [];
      }
    },
    enabled: !!lat && !!lng && !!SONGKICK_API_KEY,
    staleTime: CONCERTS_STALE_TIME,
  });
}

/**
 * Hook : prochain concert d'un groupe
 */
export function useNextConcert(bandName: string | undefined) {
  const { data: concerts, isLoading } = useBandConcerts(bandName);

  const nextConcert = concerts && concerts.length > 0
    ? concerts.sort((a, b) =>
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      )[0]
    : null;

  return {
    nextConcert,
    hasUpcomingConcerts: (concerts?.length || 0) > 0,
    isLoading,
  };
}
