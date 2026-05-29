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
      certificates: {
        Row: {
          certificate_code: string
          id: string
          issued_at: string
          issued_by: string | null
          pdf_path: string | null
          program_name: string
          recipient_name: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          certificate_code: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          pdf_path?: string | null
          program_name?: string
          recipient_name: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          certificate_code?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          pdf_path?: string | null
          program_name?: string
          recipient_name?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      datasets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          schema_info: Json | null
          slug: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          schema_info?: Json | null
          slug: string
          storage_path: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          schema_info?: Json | null
          slug?: string
          storage_path?: string
        }
        Relationships: []
      }
      exercise_submissions: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_correct: boolean
          result_preview: Json | null
          sql_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_correct?: boolean
          result_preview?: Json | null
          sql_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_correct?: boolean
          result_preview?: Json | null
          sql_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          dataset_ids: string[]
          difficulty: string
          expected_result_json: Json | null
          expected_sql: string | null
          id: string
          lesson_id: string | null
          order_matters: boolean
          prompt: string
          starter_sql: string | null
          title: string
        }
        Insert: {
          created_at?: string
          dataset_ids?: string[]
          difficulty?: string
          expected_result_json?: Json | null
          expected_sql?: string | null
          id?: string
          lesson_id?: string | null
          order_matters?: boolean
          prompt: string
          starter_sql?: string | null
          title: string
        }
        Update: {
          created_at?: string
          dataset_ids?: string[]
          difficulty?: string
          expected_result_json?: Json | null
          expected_sql?: string | null
          id?: string
          lesson_id?: string | null
          order_matters?: boolean
          prompt?: string
          starter_sql?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          difficulty: string
          hints: string | null
          id: string
          is_published: boolean
          prompt: string
          sample_answer: string | null
          source: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          difficulty?: string
          hints?: string | null
          id?: string
          is_published?: boolean
          prompt: string
          sample_answer?: string | null
          source?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          difficulty?: string
          hints?: string | null
          id?: string
          is_published?: boolean
          prompt?: string
          sample_answer?: string | null
          source?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          id: string
          module_id: string
          slug: string
          sort_order: number
          summary: string | null
          title: string
          try_it_datasets: string[] | null
          try_it_sql: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          module_id: string
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
          try_it_datasets?: string[] | null
          try_it_sql?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          module_id?: string
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
          try_it_datasets?: string[] | null
          try_it_sql?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_responses: {
        Row: {
          admin_feedback: string | null
          admin_score: number | null
          answer: string | null
          created_at: string
          id: string
          question_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          self_rating: number | null
          session_id: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_feedback?: string | null
          admin_score?: number | null
          answer?: string | null
          created_at?: string
          id?: string
          question_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          self_rating?: number | null
          session_id: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_feedback?: string | null
          admin_score?: number | null
          answer?: string | null
          created_at?: string
          id?: string
          question_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          self_rating?: number | null
          session_id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_interview_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mock_interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_sessions: {
        Row: {
          created_at: string
          focus: string
          id: string
          overall_feedback: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          focus?: string
          id?: string
          overall_feedback?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          focus?: string
          id?: string
          overall_feedback?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          summary: string | null
          title: string
          track_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
          track_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          handle: string | null
          headline: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          handle?: string | null
          headline?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          handle?: string | null
          headline?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_submissions: {
        Row: {
          code: string | null
          created_at: string
          dashboard_url: string | null
          feedback: string | null
          file_path: string | null
          github_repo_url: string | null
          id: string
          project_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          status: Database["public"]["Enums"]["submission_status"]
          title: string | null
          updated_at: string
          user_id: string
          writeup: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          dashboard_url?: string | null
          feedback?: string | null
          file_path?: string | null
          github_repo_url?: string | null
          id?: string
          project_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          title?: string | null
          updated_at?: string
          user_id: string
          writeup?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          dashboard_url?: string | null
          feedback?: string | null
          file_path?: string | null
          github_repo_url?: string | null
          id?: string
          project_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          title?: string | null
          updated_at?: string
          user_id?: string
          writeup?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          dataset_ids: string[]
          deliverables: string | null
          difficulty: string
          id: string
          is_published: boolean
          rubric: Json | null
          scenario: string
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          dataset_ids?: string[]
          deliverables?: string | null
          difficulty?: string
          id?: string
          is_published?: boolean
          rubric?: Json | null
          scenario: string
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          dataset_ids?: string[]
          deliverables?: string | null
          difficulty?: string
          id?: string
          is_published?: boolean
          rubric?: Json | null
          scenario?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          explanation: string | null
          id: string
          options: Json
          question: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          correct_index: number
          explanation?: string | null
          id?: string
          options: Json
          question: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          pass_threshold: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          pass_threshold?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          pass_threshold?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["track_level"]
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["track_level"]
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["track_level"]
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
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
      exercises_public: {
        Row: {
          created_at: string | null
          dataset_ids: string[] | null
          difficulty: string | null
          gradable: boolean | null
          id: string | null
          lesson_id: string | null
          order_matters: boolean | null
          prompt: string | null
          starter_sql: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          dataset_ids?: string[] | null
          difficulty?: string | null
          gradable?: never
          id?: string | null
          lesson_id?: string | null
          order_matters?: boolean | null
          prompt?: string | null
          starter_sql?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          dataset_ids?: string[] | null
          difficulty?: string | null
          gradable?: never
          id?: string | null
          lesson_id?: string | null
          order_matters?: boolean | null
          prompt?: string | null
          starter_sql?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          handle: string | null
          headline: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          handle?: string | null
          headline?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          handle?: string | null
          headline?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_questions_public: {
        Row: {
          id: string | null
          options: Json | null
          question: string | null
          quiz_id: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string | null
          options?: Json | null
          question?: string | null
          quiz_id?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string | null
          options?: Json | null
          question?: string | null
          quiz_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      grade_exercise: {
        Args: { _exercise_id: string; _sql_text: string; _submitted: Json }
        Returns: {
          gradable: boolean
          is_correct: boolean
        }[]
      }
      grade_quiz: {
        Args: { _answers: Json; _quiz_id: string }
        Returns: {
          pass_threshold: number
          passed: boolean
          per_question: Json
          score: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      public_certificate_for_user: {
        Args: { _user_id: string }
        Returns: {
          certificate_code: string
          issued_at: string
          program_name: string
          recipient_name: string
        }[]
      }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          certificate_code: string
          full_name: string
          handle: string
          issued_at: string
          program_name: string
          recipient_name: string
          revoked_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "learner"
      submission_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "needs_revision"
      track_level: "beginner" | "intermediate" | "advanced"
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
      app_role: ["admin", "learner"],
      submission_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "needs_revision",
      ],
      track_level: ["beginner", "intermediate", "advanced"],
    },
  },
} as const
