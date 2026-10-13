export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: 'RBT' | 'BCBA' | 'STUDENT' | null;
          renewal_date: string | null;
          org_id: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: 'RBT' | 'BCBA' | 'STUDENT' | null;
          renewal_date?: string | null;
          org_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          display_name?: string | null;
          role?: 'RBT' | 'BCBA' | 'STUDENT' | null;
          renewal_date?: string | null;
          org_id?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          track: 'RBT' | 'BCBA' | 'STUDENT' | null;
          category: 'ethics' | 'supervision' | 'general' | null;
          ceu_value: number;
          video_url: string | null;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          pass_score: number;
          quiz_required: boolean;
          is_published: boolean;
          status: 'draft' | 'pending_review' | 'published' | 'archived';
          review_note: string | null;
          transcript: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          track?: 'RBT' | 'BCBA' | 'STUDENT' | null;
          category?: 'ethics' | 'supervision' | 'general' | null;
          ceu_value?: number;
          video_url?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          pass_score?: number;
          quiz_required?: boolean;
          is_published?: boolean;
          status?: 'draft' | 'pending_review' | 'published' | 'archived';
          review_note?: string | null;
          transcript?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          track?: 'RBT' | 'BCBA' | 'STUDENT' | null;
          category?: 'ethics' | 'supervision' | 'general' | null;
          ceu_value?: number;
          video_url?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          pass_score?: number;
          quiz_required?: boolean;
          is_published?: boolean;
          status?: 'draft' | 'pending_review' | 'published' | 'archived';
          review_note?: string | null;
          transcript?: string | null;
        };
        Relationships: [];
      };
      completions: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          score: number | null;
          passed: boolean;
          cert_url: string | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          score?: number | null;
          passed?: boolean;
          cert_url?: string | null;
          completed_at?: string;
        };
        Update: {
          score?: number | null;
          passed?: boolean;
          cert_url?: string | null;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'completions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'completions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          course_id: string;
          domain: string | null;
          stem: string;
          options: Record<string, string>;
          answer: number;
          explanation: string | null;
          track: 'RBT' | 'BCBA' | 'STUDENT' | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          domain?: string | null;
          stem: string;
          options: Record<string, string>;
          answer: number;
          explanation?: string | null;
          track?: 'RBT' | 'BCBA' | 'STUDENT' | null;
        };
        Update: {
          domain?: string | null;
          stem?: string;
          options?: Record<string, string>;
          answer?: number;
          explanation?: string | null;
          track?: 'RBT' | 'BCBA' | 'STUDENT' | null;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          selected: number | null;
          is_correct: boolean | null;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          selected?: number | null;
          is_correct?: boolean | null;
          attempted_at?: string;
        };
        Update: {
          selected?: number | null;
          is_correct?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attempts_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
        ];
      };
      admin_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'editor' | 'publisher';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'admin' | 'editor' | 'publisher';
          created_at?: string;
        };
        Update: {
          role?: 'admin' | 'editor' | 'publisher';
        };
        Relationships: [];
      };
      course_views: {
        Row: {
          user_id: string;
          course_id: string;
          last_viewed_at: string;
        };
        Insert: {
          user_id: string;
          course_id: string;
          last_viewed_at?: string;
        };
        Update: {
          last_viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_views_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_views_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      resources: {
        Row: {
          id: string;
          title: string;
          author: string | null;
          type: 'book' | 'article' | 'website';
          description: string | null;
          url: string | null;
          track: 'RBT' | 'BCBA' | 'STUDENT' | null;
          category: 'ethics' | 'supervision' | 'behavior-reduction' | 'measurement' | 'general' | null;
          is_featured: boolean;
          published_year: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          author?: string | null;
          type: 'book' | 'article' | 'website';
          description?: string | null;
          url?: string | null;
          track?: 'RBT' | 'BCBA' | 'STUDENT' | null;
          category?: 'ethics' | 'supervision' | 'behavior-reduction' | 'measurement' | 'general' | null;
          is_featured?: boolean;
          published_year?: number | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          author?: string | null;
          type?: 'book' | 'article' | 'website';
          description?: string | null;
          url?: string | null;
          track?: 'RBT' | 'BCBA' | 'STUDENT' | null;
          category?: 'ethics' | 'supervision' | 'behavior-reduction' | 'measurement' | 'general' | null;
          is_featured?: boolean;
          published_year?: number | null;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          user_id: string;
          token: string;
          platform: 'ios' | 'android';
          updated_at: string;
        };
        Insert: {
          user_id: string;
          token: string;
          platform: 'ios' | 'android';
          updated_at?: string;
        };
        Update: {
          platform?: 'ios' | 'android';
          updated_at?: string;
        };
        Relationships: [];
      };
      streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          updated_at?: string;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      bug_reports: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          status: 'open' | 'in_progress' | 'resolved';
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          status?: 'open' | 'in_progress' | 'resolved';
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          category?: string;
          status?: 'open' | 'in_progress' | 'resolved';
          admin_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bug_reports_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {};
    Functions: {
      get_leaderboard: {
        Args: {
          p_role?: string | null;
          p_since?: string | null;
        };
        Returns: Array<{
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          role: string;
          total_ceus: number;
          completions_count: number;
          current_streak: number;
          longest_streak: number;
        }>;
      };
      is_user_admin: {
        Args: {
          target_user_id: string;
        };
        Returns: boolean;
      };
      get_user_ceu_summary: {
        Args: {
          p_user_id: string;
        };
        Returns: Array<{
          category: string;
          ceu_total: number;
          completions_count: number;
        }>;
      };
    };
  };
};
