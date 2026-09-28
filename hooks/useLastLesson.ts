import { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/types/database';

export type Course = Database['public']['Tables']['courses']['Row'];

export function useLastLesson() {
  const { user } = useAuth();
  const [lastLesson, setLastLesson] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !hasSupabaseEnv) { setLoading(false); return; }

    let active = true;

    async function load() {
      const [{ data: views }, { data: completed }] = await Promise.all([
        supabase
          .from('course_views')
          .select('course_id')
          .eq('user_id', user!.id)
          .order('last_viewed_at', { ascending: false })
          .limit(20),
        supabase
          .from('completions')
          .select('course_id')
          .eq('user_id', user!.id)
          .eq('passed', true),
      ]);

      const completedIds = new Set((completed ?? []).map((c) => c.course_id));
      const resumeId = (views ?? []).find((v) => !completedIds.has(v.course_id))?.course_id;

      if (!resumeId) { if (active) setLoading(false); return; }

      const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', resumeId)
        .eq('status', 'published')
        .single();

      if (active) {
        setLastLesson(course ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [user?.id]);

  return { lastLesson, loading };
}

export async function logCourseView(userId: string, courseId: string) {
  if (!hasSupabaseEnv) return;
  await supabase
    .from('course_views')
    .upsert(
      { user_id: userId, course_id: courseId, last_viewed_at: new Date().toISOString() },
      { onConflict: 'user_id,course_id' },
    );
}
