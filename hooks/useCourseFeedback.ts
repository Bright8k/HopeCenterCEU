import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/types/database';

export type CourseFeedback = Database['public']['Tables']['course_feedback']['Row'];

/** The signed-in learner's feedback for a course they have completed. */
export function useCourseFeedback(courseId: string) {
  const { user } = useAuth();
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState<CourseFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!hasSupabaseEnv || !user || !courseId) {
      setLoading(false);
      return;
    }
    Promise.all([
      supabase.from('completions').select('id').eq('user_id', user.id).eq('course_id', courseId).limit(1),
      supabase.from('course_feedback').select('*').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
    ]).then(([comp, fb]) => {
      if (!active) return;
      setCompleted((comp.data?.length ?? 0) > 0);
      setFeedback((fb.data as CourseFeedback | null) ?? null);
      setLoading(false);
    });
    return () => { active = false; };
  }, [courseId, user?.id]);

  const submit = useCallback(async (rating: number, comments: string) => {
    if (!user) return false;
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('course_feedback')
      .upsert(
        { user_id: user.id, course_id: courseId, rating, comments: comments.trim() || null, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,course_id' },
      )
      .select('*')
      .single();
    setSaving(false);
    if (err) {
      setError('Your feedback could not be sent. Try again.');
      return false;
    }
    setFeedback(data as CourseFeedback);
    return true;
  }, [courseId, user?.id]);

  return { completed, feedback, loading, saving, error, submit };
}

/** Admin view of every learner's feedback on a course. */
export function useCourseFeedbackList(courseId: string | undefined) {
  const [items, setItems] = useState<CourseFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!hasSupabaseEnv || !courseId) {
      setLoading(false);
      return;
    }
    supabase
      .from('course_feedback')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setItems((data as CourseFeedback[] | null) ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [courseId]);

  return { items, loading };
}
