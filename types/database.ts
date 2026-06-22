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
          is_published: boolean;
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
          is_published?: boolean;
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
          is_published?: boolean;
        };
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
        };
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
      };
    };
  };
};
