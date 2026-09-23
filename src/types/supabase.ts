export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          artist: string | null
          band_id: number
          created_at: string | null
          id: number
          image_source: string | null
          image_url: string | null
          mbid: string | null
          playcount: number | null
          raw_data: Json | null
          release_type: string | null
          source: string
          title: string
          updated_at: string | null
          uri: string | null
          url: string | null
          year: number | null
        }
        Insert: {
          artist?: string | null
          band_id: number
          created_at?: string | null
          id: number
          image_source?: string | null
          image_url?: string | null
          mbid?: string | null
          playcount?: number | null
          raw_data?: Json | null
          release_type?: string | null
          source: string
          title: string
          updated_at?: string | null
          uri?: string | null
          url?: string | null
          year?: number | null
        }
        Update: {
          artist?: string | null
          band_id?: number
          created_at?: string | null
          id?: number
          image_source?: string | null
          image_url?: string | null
          mbid?: string | null
          playcount?: number | null
          raw_data?: Json | null
          release_type?: string | null
          source?: string
          title?: string
          updated_at?: string | null
          uri?: string | null
          url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "albums_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      bands: {
        Row: {
          albums_source: string | null
          bio_lang: string | null
          biography: string | null
          country: string
          country_source: string | null
          created_at: string | null
          disbanded_date: string | null
          discogs_id: number | null
          discogs_uri: string | null
          fetched_at: string | null
          formed: number | null
          formed_date: string | null
          formed_source: string | null
          genre: string
          genre_pillar: string | null
          genre_source: string | null
          id: number
          image_source: string | null
          image_url: string | null
          listeners: number | null
          mbid: string | null
          name: string
          original_name: string | null
          rating: number | null
          rating_votes: number | null
          source_tag: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          albums_source?: string | null
          bio_lang?: string | null
          biography?: string | null
          country: string
          country_source?: string | null
          created_at?: string | null
          disbanded_date?: string | null
          discogs_id?: number | null
          discogs_uri?: string | null
          fetched_at?: string | null
          formed?: number | null
          formed_date?: string | null
          formed_source?: string | null
          genre: string
          genre_pillar?: string | null
          genre_source?: string | null
          id: number
          image_source?: string | null
          image_url?: string | null
          listeners?: number | null
          mbid?: string | null
          name: string
          original_name?: string | null
          rating?: number | null
          rating_votes?: number | null
          source_tag?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          albums_source?: string | null
          bio_lang?: string | null
          biography?: string | null
          country?: string
          country_source?: string | null
          created_at?: string | null
          disbanded_date?: string | null
          discogs_id?: number | null
          discogs_uri?: string | null
          fetched_at?: string | null
          formed?: number | null
          formed_date?: string | null
          formed_source?: string | null
          genre?: string
          genre_pillar?: string | null
          genre_source?: string | null
          id?: number
          image_source?: string | null
          image_url?: string | null
          listeners?: number | null
          mbid?: string | null
          name?: string
          original_name?: string | null
          rating?: number | null
          rating_votes?: number | null
          source_tag?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gamification_progress: {
        Row: {
          badges_unlocked: string[] | null
          created_at: string | null
          genres_explored: string[] | null
          last_daily_bonus: string | null
          level: number | null
          quests_completed: string[] | null
          total_favorites: number | null
          total_reviews: number | null
          total_views: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badges_unlocked?: string[] | null
          created_at?: string | null
          genres_explored?: string[] | null
          last_daily_bonus?: string | null
          level?: number | null
          quests_completed?: string[] | null
          total_favorites?: number | null
          total_reviews?: number | null
          total_views?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badges_unlocked?: string[] | null
          created_at?: string | null
          genres_explored?: string[] | null
          last_daily_bonus?: string | null
          level?: number | null
          quests_completed?: string[] | null
          total_favorites?: number | null
          total_reviews?: number | null
          total_views?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          band_id: number
          begin_date: string | null
          created_at: string | null
          end_date: string | null
          id: number
          is_active: boolean | null
          name: string
          role: string | null
          source: string | null
        }
        Insert: {
          band_id: number
          begin_date?: string | null
          created_at?: string | null
          end_date?: string | null
          id: number
          is_active?: boolean | null
          name: string
          role?: string | null
          source?: string | null
        }
        Update: {
          band_id?: number
          begin_date?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          role?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          favorite_genres: string[] | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          favorite_genres?: string[] | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          favorite_genres?: string[] | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answered_at: string | null
          id: string
          is_correct: boolean
          question_id: string | null
          user_answer: string
          user_id: string | null
          xp_earned: number | null
        }
        Insert: {
          answered_at?: string | null
          id?: string
          is_correct: boolean
          question_id?: string | null
          user_answer: string
          user_id?: string | null
          xp_earned?: number | null
        }
        Update: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string | null
          user_answer?: string
          user_id?: string | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          band_id: number | null
          correct_answer: string
          created_at: string | null
          difficulty: number | null
          id: string
          pillar_id: string
          question_text: string
          question_type: string
          wrong_answers: string[]
        }
        Insert: {
          band_id?: number | null
          correct_answer: string
          created_at?: string | null
          difficulty?: number | null
          id?: string
          pillar_id: string
          question_text: string
          question_type: string
          wrong_answers: string[]
        }
        Update: {
          band_id?: number | null
          correct_answer?: string
          created_at?: string | null
          difficulty?: number | null
          id?: string
          pillar_id?: string
          question_text?: string
          question_type?: string
          wrong_answers?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          album_id: number | null
          band_id: number
          content: string
          created_at: string | null
          id: string
          rating: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          album_id?: number | null
          band_id: number
          content: string
          created_at?: string | null
          id?: string
          rating: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          album_id?: number | null
          band_id?: number
          content?: string
          created_at?: string | null
          id?: string
          rating?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_classes: {
        Row: {
          chosen_at: string | null
          class_id: string
          class_level: number
          class_xp: number
          id: string
          user_id: string
        }
        Insert: {
          chosen_at?: string | null
          class_id: string
          class_level?: number
          class_xp?: number
          id?: string
          user_id: string
        }
        Update: {
          chosen_at?: string | null
          class_id?: string
          class_level?: number
          class_xp?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          band_id: number
          created_at: string | null
          user_id: string
        }
        Insert: {
          band_id: number
          created_at?: string | null
          user_id: string
        }
        Update: {
          band_id?: number
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_history: {
        Row: {
          action: string
          amount: number
          created_at: string | null
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          badge_count: number | null
          id: string | null
          level: number | null
          total_favorites: number | null
          total_reviews: number | null
          total_views: number | null
          total_xp: number | null
          username: string | null
        }
        Relationships: []
      }
      top_reviews: {
        Row: {
          album_id: number | null
          avatar_url: string | null
          band_id: number | null
          content: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_xp: {
        Args: {
          p_action: string
          p_amount: number
          p_description?: string
          p_user_id: string
        }
        Returns: undefined
      }
      calculate_level: { Args: { xp: number }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ═══════════════════════════════════════════════════════════
// TYPES ALIAS (conservés de l'ancien fichier + étendus)
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────
// GAMIFICATION
// ─────────────────────────────────────────
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type UserFavorite = Database['public']['Tables']['user_favorites']['Row'];
export type GamificationProgress = Database['public']['Tables']['gamification_progress']['Row'];
export type XPHistory = Database['public']['Tables']['xp_history']['Row'];
export type UserClass = Database['public']['Tables']['user_classes']['Row'];

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type GamificationProgressInsert = Database['public']['Tables']['gamification_progress']['Insert'];
export type UserClassInsert = Database['public']['Tables']['user_classes']['Insert'];

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];
export type GamificationProgressUpdate = Database['public']['Tables']['gamification_progress']['Update'];
export type UserClassUpdate = Database['public']['Tables']['user_classes']['Update'];

// ─────────────────────────────────────────
// MÉTIER (GROUPES, ALBUMS, MEMBRES)
// ─────────────────────────────────────────
export type Band = Database['public']['Tables']['bands']['Row'];
export type Album = Database['public']['Tables']['albums']['Row'];
export type Member = Database['public']['Tables']['members']['Row'];

export type BandInsert = Database['public']['Tables']['bands']['Insert'];
export type AlbumInsert = Database['public']['Tables']['albums']['Insert'];
export type MemberInsert = Database['public']['Tables']['members']['Insert'];

export type BandUpdate = Database['public']['Tables']['bands']['Update'];
export type AlbumUpdate = Database['public']['Tables']['albums']['Update'];
export type MemberUpdate = Database['public']['Tables']['members']['Update'];

// ─────────────────────────────────────────
// QUIZ
// ─────────────────────────────────────────
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];
export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];

export type QuizQuestionInsert = Database['public']['Tables']['quiz_questions']['Insert'];
export type QuizAttemptInsert = Database['public']['Tables']['quiz_attempts']['Insert'];

// ─────────────────────────────────────────
// INTERFACES ENRICHIES (avec relations)
// ─────────────────────────────────────────
export interface ReviewWithAuthor extends Review {
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export interface ProfileWithStats extends Profile {
  gamification_progress: GamificationProgress | null;
}

export interface BandWithAlbums extends Band {
  albums: Album[];
}

export interface BandWithMembers extends Band {
  members: Member[];
}

export interface BandComplete extends Band {
  albums: Album[];
  members: Member[];
}

// ─────────────────────────────────────────
// HELPERS GÉNÉRIQUES
// ─────────────────────────────────────────
export type TableName = keyof Database['public']['Tables'];
export type RowType<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type InsertType<T extends TableName> = Database['public']['Tables'][T]['Insert'];
export type UpdateType<T extends TableName> = Database['public']['Tables'][T]['Update'];
