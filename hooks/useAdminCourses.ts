import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type Course = Database['public']['Tables']['courses']['Row'];

export type CourseSort = 'recent' | 'title' | 'ceu';

export function useAdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!hasSupabaseEnv) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    setCourses((data as Course[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const togglePublish = useCallback(async (course: Course): Promise<{ error?: string }> => {
    if (!hasSupabaseEnv) return { error: 'Supabase not configured' };
    const { error } = await supabase.functions.invoke('publish-course', {
      body: { courseId: course.id, isPublished: !course.is_published },
    });
    if (error) return { error: error.message };
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, is_published: !c.is_published } : c)),
    );
    return {};
  }, []);

  return { courses, loading, refetch: fetch, togglePublish };
}
