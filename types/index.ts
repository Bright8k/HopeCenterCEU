export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  duration_minutes: number;
  ceu_credits: number;
  category: string | null;
  published: boolean;
  created_at: string;
};

export type CourseProgress = {
  id: string;
  user_id: string;
  course_id: string;
  completed: boolean;
  progress_percent: number;
  completed_at: string | null;
  created_at: string;
};

export type CEURecord = {
  id: string;
  user_id: string;
  course_id: string;
  credits_earned: number;
  awarded_at: string;
};
