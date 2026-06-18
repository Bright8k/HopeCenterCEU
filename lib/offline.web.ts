// Web stub — expo-sqlite is not available on web.
// Metro resolves this file for web builds instead of offline.ts.

export interface OfflineCourse {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  ceu_value: number;
  pass_score: number;
  duration_seconds: number | null;
  video_url: string | null;
  is_published: boolean;
  cached_at: string;
}

export interface OfflineQuestion {
  id: string;
  course_id: string;
  stem: string;
  options: string[];
  answer: number;
  domain: string | null;
}

export const saveCourseOffline = async () => {};
export const removeCourseOffline = async () => {};
export const getCachedCourse = async (): Promise<OfflineCourse | null> => null;
export const getAllCachedCourses = async (): Promise<OfflineCourse[]> => [];
export const getCachedQuestions = async (): Promise<OfflineQuestion[]> => [];
export const isCourseDownloaded = async (): Promise<boolean> => false;
