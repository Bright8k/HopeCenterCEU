import { useEffect, useMemo, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { UserRole } from '@/constants/roles';
import { PREVIEW_COURSES, type Course } from '@/constants/previewContent';

export function useCourses(role: UserRole | null) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function fetchCourses(active = true) {
    if (!hasSupabaseEnv) {
      if (active) {
        setCourses([]);
        setErrorMessage(null);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    let request = supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (role) {
      request = request.eq('track', role);
    }

    const { data, error } = await request;

    if (!active) return;

    if (error) {
      setCourses([]);
      setErrorMessage(error.message);
    } else {
      setCourses((data as Course[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    fetchCourses(active);

    return () => {
      active = false;
    };
  }, [role]);

  const displayCourses = useMemo(
    () => (hasSupabaseEnv && courses.length > 0 ? courses : PREVIEW_COURSES.filter((course) => !role || course.track === role)),
    [courses, role],
  );

  return {
    courses,
    displayCourses,
    loading,
    errorMessage,
    refetch: () => fetchCourses(true),
    usingPreviewData: !hasSupabaseEnv || (courses.length === 0 && !errorMessage),
  };
}
