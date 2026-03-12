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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      challenge_results: {
        Row: {
          challenger_name: string
          created_at: string
          id: string
          percentage: number
          score: number
          session_id: string
          time_seconds: number | null
          total_questions: number
        }
        Insert: {
          challenger_name: string
          created_at?: string
          id?: string
          percentage: number
          score: number
          session_id: string
          time_seconds?: number | null
          total_questions: number
        }
        Update: {
          challenger_name?: string
          created_at?: string
          id?: string
          percentage?: number
          score?: number
          session_id?: string
          time_seconds?: number | null
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "challenge_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_sessions: {
        Row: {
          created_at: string
          creator_name: string
          creator_percentage: number | null
          creator_score: number | null
          creator_time_seconds: number | null
          exam_form: string | null
          exam_year: number | null
          expires_at: string
          id: string
          question_ids: Json
          subject_id: string
        }
        Insert: {
          created_at?: string
          creator_name: string
          creator_percentage?: number | null
          creator_score?: number | null
          creator_time_seconds?: number | null
          exam_form?: string | null
          exam_year?: number | null
          expires_at?: string
          id?: string
          question_ids: Json
          subject_id: string
        }
        Update: {
          created_at?: string
          creator_name?: string
          creator_percentage?: number | null
          creator_score?: number | null
          creator_time_seconds?: number | null
          exam_form?: string | null
          exam_year?: number | null
          expires_at?: string
          id?: string
          question_ids?: Json
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          created_at: string
          id: string
          question_data: Json | null
          question_id: string | null
          reason: string | null
          request_type: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_question_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question_data?: Json | null
          question_id?: string | null
          reason?: string | null
          request_type?: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_question_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question_data?: Json | null
          question_id?: string | null
          reason?: string | null
          request_type?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deletion_requests_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deletion_requests_target_question_id_fkey"
            columns: ["target_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          answers: Json | null
          challenge_session_id: string | null
          created_at: string
          exam_year: number | null
          id: string
          passed: boolean
          passing_score: number
          score: number
          score_percentage: number | null
          student_name: string
          subject_id: string
          time_taken_seconds: number | null
          total_questions: number
        }
        Insert: {
          answers?: Json | null
          challenge_session_id?: string | null
          created_at?: string
          exam_year?: number | null
          id?: string
          passed: boolean
          passing_score: number
          score: number
          score_percentage?: number | null
          student_name: string
          subject_id: string
          time_taken_seconds?: number | null
          total_questions: number
        }
        Update: {
          answers?: Json | null
          challenge_session_id?: string | null
          created_at?: string
          exam_year?: number | null
          id?: string
          passed?: boolean
          passing_score?: number
          score?: number
          score_percentage?: number | null
          student_name?: string
          subject_id?: string
          time_taken_seconds?: number | null
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          disabled_message: string | null
          id: string
          is_disabled: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          disabled_message?: string | null
          id?: string
          is_disabled?: boolean
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          disabled_message?: string | null
          id?: string
          is_disabled?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      question_stats: {
        Row: {
          correct_answers: number
          option_a_count: number
          option_b_count: number
          option_c_count: number
          option_d_count: number
          question_id: string
          total_answers: number
          updated_at: string
        }
        Insert: {
          correct_answers?: number
          option_a_count?: number
          option_b_count?: number
          option_c_count?: number
          option_d_count?: number
          question_id: string
          total_answers?: number
          updated_at?: string
        }
        Update: {
          correct_answers?: number
          option_a_count?: number
          option_b_count?: number
          option_c_count?: number
          option_d_count?: number
          question_id?: string
          total_answers?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_stats_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_option: string
          created_at: string
          created_by: string | null
          exam_form: string | null
          exam_year: number | null
          hint: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          status: Database["public"]["Enums"]["deletion_status"]
          subject_id: string
          updated_at: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          created_by?: string | null
          exam_form?: string | null
          exam_year?: number | null
          hint?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          status?: Database["public"]["Enums"]["deletion_status"]
          subject_id: string
          updated_at?: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          created_by?: string | null
          exam_form?: string | null
          exam_year?: number | null
          hint?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          status?: Database["public"]["Enums"]["deletion_status"]
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics: {
        Row: {
          created_at: string
          id: string
          page_path: string
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          visitor_id?: string | null
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          badges: Json
          best_score: number
          created_at: string
          current_streak: number
          id: string
          last_exam_date: string | null
          longest_streak: number
          student_name: string
          total_correct: number
          total_exams: number
          total_questions_answered: number
          updated_at: string
        }
        Insert: {
          badges?: Json
          best_score?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_exam_date?: string | null
          longest_streak?: number
          student_name: string
          total_correct?: number
          total_exams?: number
          total_questions_answered?: number
          updated_at?: string
        }
        Update: {
          badges?: Json
          best_score?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_exam_date?: string | null
          longest_streak?: number
          student_name?: string
          total_correct?: number
          total_exams?: number
          total_questions_answered?: number
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          allow_time_modification: boolean
          author_name: string | null
          created_at: string
          default_time_minutes: number
          description: string | null
          id: string
          level_id: string
          max_time_minutes: number | null
          min_time_minutes: number | null
          name: string
          order_index: number
          passing_score: number
          password: string | null
          questions_per_exam: number
          updated_at: string
        }
        Insert: {
          allow_time_modification?: boolean
          author_name?: string | null
          created_at?: string
          default_time_minutes?: number
          description?: string | null
          id?: string
          level_id: string
          max_time_minutes?: number | null
          min_time_minutes?: number | null
          name: string
          order_index?: number
          passing_score?: number
          password?: string | null
          questions_per_exam?: number
          updated_at?: string
        }
        Update: {
          allow_time_modification?: boolean
          author_name?: string | null
          created_at?: string
          default_time_minutes?: number
          description?: string | null
          id?: string
          level_id?: string
          max_time_minutes?: number | null
          min_time_minutes?: number | null
          name?: string
          order_index?: number
          passing_score?: number
          password?: string | null
          questions_per_exam?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
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
          role: Database["public"]["Enums"]["app_role"]
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
      get_question_count:
        | {
            Args: { p_exam_year?: number; p_subject_id: string }
            Returns: number
          }
        | {
            Args: {
              p_exam_form?: string
              p_exam_year?: number
              p_subject_id: string
            }
            Returns: number
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_editor: { Args: { _user_id: string }; Returns: boolean }
      record_question_answer: {
        Args: {
          p_is_correct: boolean
          p_question_id: string
          p_selected_option: string
        }
        Returns: undefined
      }
      soft_delete_questions: { Args: { p_ids: string[] }; Returns: number }
      update_student_profile: {
        Args: {
          p_passed: boolean
          p_score: number
          p_student_name: string
          p_total_questions: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "editor"
      deletion_status: "active" | "pending_deletion" | "deleted"
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
      app_role: ["admin", "editor"],
      deletion_status: ["active", "pending_deletion", "deleted"],
    },
  },
} as const
