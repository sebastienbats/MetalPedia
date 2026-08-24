// ═══════════════════════════════════════════
// TYPES SUPABASE
// Générés depuis le schéma de base de données
// ═══════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ═══════════════════════════════════════════
// SCHÉMA DATABASE COMPLET
// ═══════════════════════════════════════════

export interface Database {
  public: {
    Tables: {
      // ─────────────────────────────────────
      // PROFILS UTILISATEURS
      // ─────────────────────────────────────
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          favorite_genres: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          favorite_genres?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          favorite_genres?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };

      // ─────────────────────────────────────
      // REVIEWS
      // ─────────────────────────────────────
      reviews: {
        Row: {
          id: string;
          user_id: string;
          band_id: number;
          album_id: number | null;
          rating: number;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          band_id: number;
          album_id?: number | null;
          rating: number;
          title: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          band_id?: number;
          album_id?: number | null;
          rating?: number;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ─────────────────────────────────────
      // FAVORIS UTILISATEURS
      // ─────────────────────────────────────
      user_favorites: {
        Row: {
          user_id: string;
          band_id: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          band_id: number;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          band_id?: number;
          created_at?: string;
        };
      };

      // ─────────────────────────────────────
      // PROGRESSION GAMIFICATION
      // ─────────────────────────────────────
      gamification_progress: {
        Row: {
          user_id: string;
          total_xp: number;
          level: number;
          total_views: number;
          total_favorites: number;
          total_reviews: number;
          genres_explored: string[];
          quests_completed: string[];
          badges_unlocked: string[];
          last_daily_bonus: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_xp?: number;
          level?: number;
          total_views?: number;
          total_favorites?: number;
          total_reviews?: number;
          genres_explored?: string[];
          quests_completed?: string[];
          badges_unlocked?: string[];
          last_daily_bonus?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_xp?: number;
          level?: number;
          total_views?: number;
          total_favorites?: number;
          total_reviews?: number;
          genres_explored?: string[];
          quests_completed?: string[];
          badges_unlocked?: string[];
          last_daily_bonus?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ─────────────────────────────────────
      // HISTORIQUE XP
      // ─────────────────────────────────────
      xp_history: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          amount: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          amount: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          amount?: number;
          description?: string | null;
          created_at?: string;
        };
      };
    };

    // ─────────────────────────────────────
    // VUES
    // ─────────────────────────────────────
    Views: {
      leaderboard: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          total_xp: number;
          level: number;
          total_views: number;
          total_favorites: number;
          total_reviews: number;
          badge_count: number;
        };
      };
      top_reviews: {
        Row: {
          id: string;
          user_id: string;
          band_id: number;
          album_id: number | null;
          rating: number;
          title: string;
          content: string;
          created_at: string;
          username: string;
          avatar_url: string | null;
        };
      };
    };

    // ─────────────────────────────────────
    // FONCTIONS
    // ─────────────────────────────────────
    Functions: {
      calculate_level: {
        Args: { xp: number };
        Returns: number;
      };
      add_xp: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_action: string;
          p_description?: string;
        };
        Returns: undefined;
      };
    };

    Enums: {
      [_ in never]: never;
    };
  };
}

// ═══════════════════════════════════════════
// TYPES ALIAS (plus courts à utiliser)
// ═══════════════════════════════════════════

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];

export type UserFavorite = Database['public']['Tables']['user_favorites']['Row'];

export type GamificationProgress =
  Database['public']['Tables']['gamification_progress']['Row'];
export type GamificationProgressInsert =
  Database['public']['Tables']['gamification_progress']['Insert'];

export type XPHistory = Database['public']['Tables']['xp_history']['Row'];

export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row'];

// ═══════════════════════════════════════════
// TYPES AVEC RELATIONS (JOINS)
// ═══════════════════════════════════════════

export interface ReviewWithAuthor extends Review {
  profiles: Pick<Profile, 'username' | 'avatar_url'>;
}

export interface ProfileWithStats extends Profile {
  gamification_progress: GamificationProgress | null;
}

// ═══════════════════════════════════════════
// TYPES UTILITAIRES
// ═══════════════════════════════════════════

export type TableName = keyof Database['public']['Tables'];

export type RowType<T extends TableName> =
  Database['public']['Tables'][T]['Row'];

export type InsertType<T extends TableName> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateType<T extends TableName> =
  Database['public']['Tables'][T]['Update'];
