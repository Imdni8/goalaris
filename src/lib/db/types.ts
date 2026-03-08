export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          blocker_description: string | null
          blocker_status: string | null
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          task_id: string
          title: string
          user_id: string
        }
        Insert: {
          blocker_description?: string | null
          blocker_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          task_id: string
          title: string
          user_id: string
        }
        Update: {
          blocker_description?: string | null
          blocker_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          task_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interactions: {
        Row: {
          created_at: string | null
          goal_id: string | null
          id: string
          interaction_type: string
          prompt: string
          response: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id?: string | null
          id?: string
          interaction_type: string
          prompt: string
          response: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string | null
          id?: string
          interaction_type?: string
          prompt?: string
          response?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_name: string
          id: string
          properties: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_name: string
          id?: string
          properties?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_name?: string
          id?: string
          properties?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          content: string
          created_at: string | null
          date_range_end: string | null
          date_range_start: string | null
          goal_ids: string[] | null
          id: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          goal_ids?: string[] | null
          id?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          goal_ids?: string[] | null
          id?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_whitelist: {
        Row: {
          added_at: string | null
          email: string
          notes: string | null
          signup_completed_at: string | null
        }
        Insert: {
          added_at?: string | null
          email: string
          notes?: string | null
          signup_completed_at?: string | null
        }
        Update: {
          added_at?: string | null
          email?: string
          notes?: string | null
          signup_completed_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          achievable: string | null
          ai_suggested: boolean | null
          created_at: string | null
          description: string | null
          id: string
          measurable: string | null
          relevant: string | null
          specific: string | null
          status: string | null
          time_bound: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievable?: string | null
          ai_suggested?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          measurable?: string | null
          relevant?: string | null
          specific?: string | null
          status?: string | null
          time_bound?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievable?: string | null
          ai_suggested?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          measurable?: string | null
          relevant?: string | null
          specific?: string | null
          status?: string | null
          time_bound?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          assessment_cycle: string | null
          career_goal: string | null
          company: string | null
          created_at: string | null
          full_name: string | null
          id: string
          job_title: string | null
          key_skills: string[] | null
          onboarding_completed: boolean | null
          review_cycle_timing: string | null
          team: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_cycle?: string | null
          career_goal?: string | null
          company?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          key_skills?: string[] | null
          onboarding_completed?: boolean | null
          review_cycle_timing?: string | null
          team?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_cycle?: string | null
          career_goal?: string | null
          company?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          key_skills?: string[] | null
          onboarding_completed?: boolean | null
          review_cycle_timing?: string | null
          team?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          ai_generated: boolean | null
          blocker_description: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          goal_id: string
          id: string
          order_index: number
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          blocker_description?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          goal_id: string
          id?: string
          order_index: number
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          blocker_description?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          goal_id?: string
          id?: string
          order_index?: number
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

