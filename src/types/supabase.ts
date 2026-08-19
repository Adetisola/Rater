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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          awarded_at: string | null
          badge_type: Database["public"]["Enums"]["badge_type"]
          id: string
          post_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_type: Database["public"]["Enums"]["badge_type"]
          id?: string
          post_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_type?: Database["public"]["Enums"]["badge_type"]
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_metrics"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "badges_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          name: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      feedback_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          request_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          request_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feedback_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feedback_requests_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_requests: {
        Row: {
          admin_notes: string | null
          author_id: string
          category: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string
          fts: unknown
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          slug: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          author_id: string
          category: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          fts?: unknown
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          slug: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          author_id?: string
          category?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          fts?: unknown
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          slug?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_requests_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_requests_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_votes: {
        Row: {
          created_at: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feedback_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feedback_requests_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_cache: {
        Row: {
          created_at: string | null
          post_id: string
          result: Json
          review_count: number
        }
        Insert: {
          created_at?: string | null
          post_id: string
          result: Json
          review_count: number
        }
        Update: {
          created_at?: string | null
          post_id?: string
          result?: Json
          review_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "insight_cache_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "post_metrics"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "insight_cache_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          avatar_id: string
          created_at: string | null
          feedback_request_id: string | null
          id: string
          is_read: boolean | null
          message: string | null
          post_id: string | null
          type: string
        }
        Insert: {
          actor_id?: string | null
          avatar_id: string
          created_at?: string | null
          feedback_request_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          post_id?: string | null
          type: string
        }
        Update: {
          actor_id?: string | null
          avatar_id?: string
          created_at?: string | null
          feedback_request_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          post_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_feedback_request_id_fkey"
            columns: ["feedback_request_id"]
            isOneToOne: false
            referencedRelation: "feedback_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_feedback_request_id_fkey"
            columns: ["feedback_request_id"]
            isOneToOne: false
            referencedRelation: "feedback_requests_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_metrics"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string
          guest_session_hash: string | null
          id: string
          ip_hash: string | null
          post_id: string
          updated_at: string
          user_agent_hash: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          guest_session_hash?: string | null
          id?: string
          ip_hash?: string | null
          post_id: string
          updated_at?: string
          user_agent_hash?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          guest_session_hash?: string | null
          id?: string
          ip_hash?: string | null
          post_id?: string
          updated_at?: string
          user_agent_hash?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_metrics"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_prompt: string | null
          ai_tool: string | null
          avatar_id: string
          average_score: number | null
          category: string
          created_at: string | null
          criteria_scores: Json | null
          deleted_at: string | null
          description: string | null
          edited_at: string | null
          id: string
          image_url: string
          insights_stale: boolean | null
          is_deleted: boolean | null
          media: Json | null
          review_count: number | null
          title: string
          updated_at: string | null
          uses_ai: boolean
          view_count: number | null
        }
        Insert: {
          ai_prompt?: string | null
          ai_tool?: string | null
          avatar_id: string
          average_score?: number | null
          category: string
          created_at?: string | null
          criteria_scores?: Json | null
          deleted_at?: string | null
          description?: string | null
          edited_at?: string | null
          id?: string
          image_url: string
          insights_stale?: boolean | null
          is_deleted?: boolean | null
          media?: Json | null
          review_count?: number | null
          title: string
          updated_at?: string | null
          uses_ai?: boolean
          view_count?: number | null
        }
        Update: {
          ai_prompt?: string | null
          ai_tool?: string | null
          avatar_id?: string
          average_score?: number | null
          category?: string
          created_at?: string | null
          criteria_scores?: Json | null
          deleted_at?: string | null
          description?: string | null
          edited_at?: string | null
          id?: string
          image_url?: string
          insights_stale?: boolean | null
          is_deleted?: boolean | null
          media?: Json | null
          review_count?: number | null
          title?: string
          updated_at?: string | null
          uses_ai?: boolean
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["name"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bg_color: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_admin: boolean | null
          is_blocked: boolean | null
          name: string
          onboarding_completed: boolean | null
          passkey: string | null
          previous_usernames: string[] | null
          role: string | null
          show_email: boolean | null
          social_links: Json | null
          updated_at: string | null
          username: string
          username_last_changed_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bg_color?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          name: string
          onboarding_completed?: boolean | null
          passkey?: string | null
          previous_usernames?: string[] | null
          role?: string | null
          show_email?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
          username: string
          username_last_changed_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bg_color?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          name?: string
          onboarding_completed?: boolean | null
          passkey?: string | null
          previous_usernames?: string[] | null
          role?: string | null
          show_email?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
          username?: string
          username_last_changed_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          action_taken: string | null
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          aesthetics: number | null
          clarity: number | null
          comment: string | null
          composition: number | null
          created_at: string | null
          detail: number | null
          device_id: string | null
          engagement: number | null
          id: string
          impact: number | null
          post_id: string
          purpose: number | null
          recognition: number | null
          reviewer_id: string | null
          reviewer_name: string | null
          updated_at: string | null
          usability: number | null
        }
        Insert: {
          aesthetics?: number | null
          clarity?: number | null
          comment?: string | null
          composition?: number | null
          created_at?: string | null
          detail?: number | null
          device_id?: string | null
          engagement?: number | null
          id?: string
          impact?: number | null
          post_id: string
          purpose?: number | null
          recognition?: number | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
          usability?: number | null
        }
        Update: {
          aesthetics?: number | null
          clarity?: number | null
          comment?: string | null
          composition?: number | null
          created_at?: string | null
          detail?: number | null
          device_id?: string | null
          engagement?: number | null
          id?: string
          impact?: number | null
          post_id?: string
          purpose?: number | null
          recognition?: number | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
          usability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_metrics"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "reviews_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      feedback_requests_with_stats: {
        Row: {
          author_id: string | null
          category: string | null
          comment_count: number | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          fts: unknown
          id: string | null
          is_locked: boolean | null
          is_pinned: boolean | null
          slug: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          upvote_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          comment_count?: never
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          fts?: unknown
          id?: string | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          slug?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          upvote_count?: never
        }
        Update: {
          author_id?: string | null
          category?: string | null
          comment_count?: never
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          fts?: unknown
          id?: string | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          slug?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          upvote_count?: never
        }
        Relationships: [
          {
            foreignKeyName: "feedback_requests_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_requests_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics: {
        Row: {
          average_score: number | null
          post_id: string | null
          rating_unlocked: boolean | null
          review_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_email_for_login: {
        Args: { p_password: string; p_username: string }
        Returns: string
      }
      record_post_view:
        | {
            Args: {
              p_guest_session_hash: string
              p_ip_hash: string
              p_post_id: string
              p_user_agent_hash: string
              p_viewer_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_guest_session_hash: string
              p_ip_hash: string
              p_ip_threshold?: number
              p_post_id: string
              p_user_agent_hash: string
              p_viewer_id: string
            }
            Returns: boolean
          }
    }
    Enums: {
      badge_type: "top_rated_active" | "top_rated_previous"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      badge_type: ["top_rated_active", "top_rated_previous"],
    },
  },
} as const
