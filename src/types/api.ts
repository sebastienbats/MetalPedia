export type Genre = 'Black Metal' | 'Death Metal' | 'Heavy Metal' | 'Thrash Metal' | 'Power Metal' | 'Doom Metal' | 'Progressive Metal' | 'Folk Metal';

export interface BandSearchResult {
  id: number;
  name: string;
  genre: Genre;
  country: string;
  formed?: string;
}

export interface Album {
  id: number;
  name: string;
  type: string;
  releaseDate: string;
  reviews?: { url: string; count: number; percentage: number };
  spotifyId?: string;
}

export interface BandMember {
  name: string;
  role: string;
  years?: string;
}

export interface BandDetail {
  id: number;
  name: string;
  country: string;
  location?: string;
  formed: string;
  genre: Genre;
  themes?: string;
  label?: string;
  status: string;
  yearsActive?: string;
  biography?: string;
  discography?: Album[];
  currentLineup?: BandMember[];
  pastLineup?: BandMember[];
  links?: { label: string; url: string }[];
}
