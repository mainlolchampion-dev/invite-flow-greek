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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      rsvp_responses: {
        Row: {
          attending: boolean | null
          guest_count: number | null
          guest_email: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          invitation_id: string
          message: string | null
          responded_at: string
        }
        Insert: {
          attending?: boolean | null
          guest_count?: number | null
          guest_email?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          invitation_id: string
          message?: string | null
          responded_at?: string
        }
        Update: {
          attending?: boolean | null
          guest_count?: number | null
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          invitation_id?: string
          message?: string | null
          responded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "user_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          asset_urls: Json | null
          created_at: string
          description_el: string | null
          description_en: string | null
          editable_fields: Json | null
          event_type: string
          has_countdown: boolean | null
          has_location_map: boolean | null
          has_rsvp: boolean | null
          html_content: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name_el: string
          name_en: string
          preview_images: string[] | null
          price: number | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          asset_urls?: Json | null
          created_at?: string
          description_el?: string | null
          description_en?: string | null
          editable_fields?: Json | null
          event_type: string
          has_countdown?: boolean | null
          has_location_map?: boolean | null
          has_rsvp?: boolean | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name_el: string
          name_en: string
          preview_images?: string[] | null
          price?: number | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          asset_urls?: Json | null
          created_at?: string
          description_el?: string | null
          description_en?: string | null
          editable_fields?: Json | null
          event_type?: string
          has_countdown?: boolean | null
          has_location_map?: boolean | null
          has_rsvp?: boolean | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name_el?: string
          name_en?: string
          preview_images?: string[] | null
          price?: number | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          created_at: string
          custom_data: Json | null
          event_date: string | null
          event_location: Json | null
          event_time: string | null
          event_type: string
          id: string
          project_id: string | null
          rsvp_enabled: boolean | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_data?: Json | null
          event_date?: string | null
          event_location?: Json | null
          event_time?: string | null
          event_type: string
          id?: string
          project_id?: string | null
          rsvp_enabled?: boolean | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_data?: Json | null
          event_date?: string | null
          event_location?: Json | null
          event_time?: string | null
          event_type?: string
          id?: string
          project_id?: string | null
          rsvp_enabled?: boolean | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_projects: {
        Row: {
          created_at: string
          custom_css: string | null
          id: string
          is_published: boolean | null
          modified_html: string | null
          preferred_language: string | null
          project_name: string
          published_url: string | null
          slug: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_css?: string | null
          id?: string
          is_published?: boolean | null
          modified_html?: string | null
          preferred_language?: string | null
          project_name: string
          published_url?: string | null
          slug: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_css?: string | null
          id?: string
          is_published?: boolean | null
          modified_html?: string | null
          preferred_language?: string | null
          project_name?: string
          published_url?: string | null
          slug?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_slug: {
        Args: { base_text: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
