export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  favorite_genres: string[];
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  band_id: number;
  album_id: number | null;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithAuthor extends Review {
  profiles: { username: string; avatar_url: string | null };
}
