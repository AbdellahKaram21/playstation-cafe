// ============================================================
// FILE: src/types/database.types.ts
// AUTO-GENERATED FROM SUPABASE — DO NOT EDIT MANUALLY
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      devices: {
        Row: {
          created_at: string
          hourly_rate: number
          id: string
          is_deleted: boolean
          name: string
          status: string
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string
          hourly_rate: number
          id?: string
          is_deleted?: boolean
          name: string
          status?: string
          tenant_id: string
          type?: string
        }
        Update: {
          created_at?: string
          hourly_rate?: number
          id?: string
          is_deleted?: boolean
          name?: string
          status?: string
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          plan:             string
          max_devices:      number
          max_staff:        number
          can_view_reports: boolean
          can_export:       boolean
        }
        Insert: {
          plan:              string
          max_devices?:      number
          max_staff?:        number
          can_view_reports?: boolean
          can_export?:       boolean
        }
        Update: {
          plan?:             string
          max_devices?:      number
          max_staff?:        number
          can_view_reports?: boolean
          can_export?:       boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          buy_price: number
          category: string | null
          subcategory: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          quantity: number
          sell_price: number
          tenant_id: string
        }
        Insert: {
          buy_price: number
          category?: string | null
          subcategory?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          quantity?: number
          sell_price: number
          tenant_id: string
        }
        Update: {
          buy_price?: number
          category?: string | null
          subcategory?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          quantity?: number
          sell_price?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          session_id: string | null
          sold_by: string | null
          tenant_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          session_id?: string | null
          sold_by?: string | null
          tenant_id: string
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          session_id?: string | null
          sold_by?: string | null
          tenant_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          device_id: string
          duration_minutes: number | null
          end_time: string | null
          hourly_rate: number
          id: string
          notes: string | null
          products_total: number | null
          session_price: number | null
          start_time: string
          started_by: string | null
          status: string
          tenant_id: string
          total_price: number | null
          type: string
        }
        Insert: {
          created_at?: string
          device_id: string
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate: number
          id?: string
          notes?: string | null
          products_total?: number | null
          session_price?: number | null
          start_time?: string
          started_by?: string | null
          status?: string
          tenant_id: string
          total_price?: number | null
          type?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number
          id?: string
          notes?: string | null
          products_total?: number | null
          session_price?: number | null
          start_time?: string
          started_by?: string | null
          status?: string
          tenant_id?: string
          total_price?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          plan: string
          start_date: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan: string
          start_date?: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean
          name: string
          plan: string
          status: string
          currency: string
          default_hourly_rate: number
          phone: string | null
          address: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          name: string
          plan?: string
          status?: string
          currency?: string
          default_hourly_rate?: number
          phone?: string | null
          address?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          name?: string
          plan?: string
          status?: string
          currency?: string
          default_hourly_rate?: number
          phone?: string | null
          address?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          tenant_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          tenant_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          tenant_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      end_session: {
        Args: { p_end_time?: string; p_session_id: string }
        Returns: {
          created_at: string
          device_id: string
          duration_minutes: number | null
          end_time: string | null
          hourly_rate: number
          id: string
          notes: string | null
          products_total: number | null
          session_price: number | null
          start_time: string
          started_by: string | null
          status: string
          tenant_id: string
          total_price: number | null
          type: string
        }
      }
      get_my_tenant_id: { Args: Record<PropertyKey, never>; Returns: string }
      increment_stock: {
        Args: { amount: number; p_id: string }
        Returns: undefined
      }
      sell_product: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_session_id?: string
        }
        Returns: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          session_id: string | null
          sold_by: string | null
          tenant_id: string
          total: number
          unit_price: number
        }
      }
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
  public: { Enums: {} },
} as const

// ============================================================
// DOMAIN HELPER TYPES
// ============================================================

export type PlanLimits   = { plan: string; max_devices: number; max_staff: number; can_view_reports: boolean; can_export: boolean }
export type Tenant       = Database['public']['Tables']['tenants']['Row']
export type User         = Database['public']['Tables']['users']['Row']
export type Device       = Database['public']['Tables']['devices']['Row']
export type Session      = Database['public']['Tables']['sessions']['Row']
export type Product      = Database['public']['Tables']['products']['Row']
export type Sale         = Database['public']['Tables']['sales']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']

export type DeviceInsert       = Database['public']['Tables']['devices']['Insert']
export type DeviceUpdate       = Database['public']['Tables']['devices']['Update']
export type SessionInsert      = Database['public']['Tables']['sessions']['Insert']
export type ProductInsert      = Database['public']['Tables']['products']['Insert']
export type ProductUpdate      = Database['public']['Tables']['products']['Update']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']

export type UserRole           = 'owner' | 'admin' | 'cashier' | 'super_admin'
export type DeviceType         = 'PS4' | 'PS5' | 'PC' | 'VR' | 'Ping'
export type DeviceStatus       = 'available' | 'in_use' | 'maintenance'
export type SessionStatus      = 'active' | 'paused' | 'ended'
export type SessionType        = 'open' | 'limited'
export type TenantPlan         = 'free' | 'pro' | 'enterprise'
export type TenantStatus       = 'active' | 'suspended' | 'cancelled' | 'deleted'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'
