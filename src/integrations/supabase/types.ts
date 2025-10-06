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
      contact_products: {
        Row: {
          contact_id: string
          product_id: string
        }
        Insert: {
          contact_id: string
          product_id: string
        }
        Update: {
          contact_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_products_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          additional_info: string | null
          age: number | null
          concerns: string[] | null
          conversation_id: string | null
          created_at: string | null
          discount_code: string | null
          email: string | null
          email_clicked_at: string | null
          email_opened_at: string | null
          email_sent: boolean | null
          id: string
          name: string | null
          phone: string | null
          photo_url: string | null
          product_type: string | null
          skin_type: string | null
        }
        Insert: {
          additional_info?: string | null
          age?: number | null
          concerns?: string[] | null
          conversation_id?: string | null
          created_at?: string | null
          discount_code?: string | null
          email?: string | null
          email_clicked_at?: string | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          id?: string
          name?: string | null
          phone?: string | null
          photo_url?: string | null
          product_type?: string | null
          skin_type?: string | null
        }
        Update: {
          additional_info?: string | null
          age?: number | null
          concerns?: string[] | null
          conversation_id?: string | null
          created_at?: string | null
          discount_code?: string | null
          email?: string | null
          email_clicked_at?: string | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          id?: string
          name?: string | null
          phone?: string | null
          photo_url?: string | null
          product_type?: string | null
          skin_type?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          completed: boolean | null
          created_at: string | null
          duration: number | null
          id: string
          messages: Json[] | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          duration?: number | null
          id?: string
          messages?: Json[] | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          duration?: number | null
          id?: string
          messages?: Json[] | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          clicked: boolean | null
          clicked_at: string | null
          created_at: string | null
          email_type: string
          id: string
          opened: boolean | null
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          sent: boolean | null
          subject: string
          user_id: string | null
        }
        Insert: {
          clicked?: boolean | null
          clicked_at?: string | null
          created_at?: string | null
          email_type: string
          id?: string
          opened?: boolean | null
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent?: boolean | null
          subject: string
          user_id?: string | null
        }
        Update: {
          clicked?: boolean | null
          clicked_at?: string | null
          created_at?: string | null
          email_type?: string
          id?: string
          opened?: boolean | null
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent?: boolean | null
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          brand: string | null
          category: string
          concerns_treated: string[] | null
          created_at: string | null
          description_long: string | null
          description_short: string | null
          how_to_use: string | null
          id: string
          image_url: string | null
          inci: string | null
          key_ingredients: string[] | null
          name: string
          price: number
          product_url: string
          skin_types: string[] | null
          step: string | null
          times_clicked: number | null
          times_recommended: number | null
        }
        Insert: {
          active?: boolean | null
          brand?: string | null
          category: string
          concerns_treated?: string[] | null
          created_at?: string | null
          description_long?: string | null
          description_short?: string | null
          how_to_use?: string | null
          id?: string
          image_url?: string | null
          inci?: string | null
          key_ingredients?: string[] | null
          name: string
          price: number
          product_url: string
          skin_types?: string[] | null
          step?: string | null
          times_clicked?: number | null
          times_recommended?: number | null
        }
        Update: {
          active?: boolean | null
          brand?: string | null
          category?: string
          concerns_treated?: string[] | null
          created_at?: string | null
          description_long?: string | null
          description_short?: string | null
          how_to_use?: string | null
          id?: string
          image_url?: string | null
          inci?: string | null
          key_ingredients?: string[] | null
          name?: string
          price?: number
          product_url?: string
          skin_types?: string[] | null
          step?: string | null
          times_clicked?: number | null
          times_recommended?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
