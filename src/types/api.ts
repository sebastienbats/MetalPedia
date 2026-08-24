// ═══════════════════════════════════════════
// TYPES API METAL-ARCHIVES
// Types pour les données de metal-api.dev
// ═══════════════════════════════════════════

// ─────────────────────────────────────────
// GENRES MUSICAUX
// ─────────────────────────────────────────

export type Genre =
  | 'Black Metal'
  | 'Death Metal'
  | 'Heavy Metal'
  | 'Thrash Metal'
  | 'Power Metal'
  | 'Doom Metal'
  | 'Progressive Metal'
  | 'Folk Metal'
  | 'Symphonic Metal'
  | 'Gothic Metal'
  | 'Nu Metal'
  | 'Metalcore'
  | 'Sludge Metal'
  | 'Stoner Metal'
  | 'Groove Metal';

// ─────────────────────────────────────────
// STATUTS DE GROUPE
// ─────────────────────────────────────────

export type BandStatus =
  | 'Active'
  | 'Split-up'
  | 'Changed name'
  | 'On hold'
  | 'Unknown';

// ─────────────────────────────────────────
// TYPES D'ALBUMS
// ─────────────────────────────────────────

export type AlbumType =
  | 'Full-length'
  | 'EP'
  | 'Single'
  | 'Demo'
  | 'Compilation'
  | 'Live'
  | 'Split'
  | 'Video/VOD';

// ─────────────────────────────────────────
// RÉSULTAT DE RECHERCHE (léger)
// ─────────────────────────────────────────

export interface BandSearchResult {
  id: number;
  name: string;
  genre: Genre;
  country: string;
  formed?: string;
  logo?: string;
}

// ─────────────────────────────────────────
// ALBUM
// ─────────────────────────────────────────

export interface AlbumReview {
  url: string;
  count: number;
  percentage: number;
}

export interface Album {
  id: number;
  name: string;
  type: AlbumType;
  releaseDate: string;
  catalogID?: string;
  label?: string;
  reviews?: AlbumReview;
  spotifyId?: string;
  coverUrl?: string;
}

// ─────────────────────────────────────────
// MEMBRE DE GROUPE
// ─────────────────────────────────────────

export interface BandMember {
  name: string;
  role: string;
  years?: string;
  bandId?: number;
}

// ─────────────────────────────────────────
// LIEN EXTERNE
// ─────────────────────────────────────────

export interface ExternalLink {
  label: string;
  url: string;
  type?: 'official' | 'social' | 'label' | 'shop' | 'other';
}

// ─────────────────────────────────────────
// DÉTAILS COMPLETS D'UN GROUPE
// ─────────────────────────────────────────

export interface BandDetail {
  id: number;
  name: string;
  country: string;
  location?: string;
  formed: string;
  genre: Genre;
  themes?: string;
  label?: string;
  status: BandStatus;
  yearsActive?: string;
  biography?: string;
  logo?: string;
  photo?: string;
  discography?: Album[];
  currentLineup?: BandMember[];
  pastLineup?: BandMember[];
  similarArtists?: BandSearchResult[];
  links?: ExternalLink[];
  contact?: {
    email?: string;
    website?: string;
  };
}

// ─────────────────────────────────────────
// RECHERCHE AVANCÉE
// ─────────────────────────────────────────

export interface SearchFilters {
  genre?: Genre;
  country?: string;
  yearFrom?: number;
  yearTo?: number;
  status?: BandStatus;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─────────────────────────────────────────
// ERREURS API
// ─────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  details?: string;
  code?: string;
}

// ─────────────────────────────────────────
// RECOMMANDATIONS ML
// ─────────────────────────────────────────

export interface RecommendationResult {
  name: string;
  genre: string;
  country: string;
  similarity_score: number;
  reason?: string;
}

// ─────────────────────────────────────────
// AUDIO FEATURES (Spotify)
// ─────────────────────────────────────────

export interface SpotifyAudioFeatures {
  artist_id: string;
  track_count: number;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms?: number;
}

// ─────────────────────────────────────────
// CONCERTS
// ─────────────────────────────────────────

export interface ConcertVenue {
  displayName: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface Concert {
  id: string;
  displayName: string;
  datetime: string;
  venue: ConcertVenue;
  artists: { displayName: string }[];
  uri: string;
  popularity?: number;
}

// ─────────────────────────────────────────
// STATS PERSONNELLES
// ─────────────────────────────────────────

export interface GenreBreakdown {
  genre: string;
  count: number;
  percent: number;
}

export interface CountryBreakdown {
  country: string;
  count: number;
  percent: number;
}

export interface UserStats {
  totalViews: number;
  totalFavorites: number;
  totalReviews: number;
  genresExplored: string[];
  countriesExplored: string[];
  mostViewedGenre?: string;
  mostFavoriteGenre?: string;
}
