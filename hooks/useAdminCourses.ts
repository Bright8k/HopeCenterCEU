import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type Course = Database['public']['Tables']['courses']['Row'];
export type CourseStatus = 'draft' | 'pending_review' | 'published' | 'archived';
export type ReviewAction = 'submit' | 'approve' | 'reject' | 'archive' | 'unarchive';
export type CourseSort = 'recent' | 'title' | 'ceu';

const ACTION_STATUS: Record<ReviewAction, CourseStatus> = {
  submit: 'pending_review',
  approve: 'published',
  reject: 'draft',
  archive: 'archived',
  unarchive: 'draft',
};

export function useAdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    setCourses((data as Course[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pendingCount = courses.filter((c) => c.status === 'pending_review').length;

  const setStatus = useCallback(
    async (courseId: string, action: ReviewAction, note?: string): Promise<{ error?: string }> => {
      if (!hasSupabaseEnv) return { error: 'Supabase not configured' };
      const { error } = await supabase.functions.invoke('review-course', {
        body: { courseId, action, note },
      });
      if (error) return { error: error.message };
      const newStatus = ACTION_STATUS[action];
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                status: newStatus,
                is_published: newStatus === 'published',
                review_note: action === 'reject' ? (note ?? null) : null,
              }
            : c,
        ),
      );
      return {};
    },
    [],
  );

  // Backwards-compatible toggle: published → archived, anything else → published
  const togglePublish = useCallback(
    async (course: Course): Promise<{ error?: string }> => {
      return setStatus(course.id, course.is_published ? 'archive' : 'approve');
    },
    [setStatus],
  );

  return { courses, loading, pendingCount, refetch: load, setStatus, togglePublish };
}
