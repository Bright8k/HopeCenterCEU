import { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Course = Database['public']['Tables']['courses']['Row'];

type UseCourseState = {
  course: Course | null;
  loading: boolean;
  error: string | null;
};

export function useCourse(courseId: string) {
  const [state, setState] = useState<UseCourseState>({
    course: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    if (!hasSupabaseEnv || !courseId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        setState({
          course: (data as Course | null) ?? null,
          loading: false,
          error: error?.message ?? null,
        });
      });

    return () => {
      active = false;
    };
  }, [courseId]);

  return state;
}
