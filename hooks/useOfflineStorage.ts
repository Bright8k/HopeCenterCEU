import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import {
  isCourseDownloaded,
  saveCourseOffline,
  removeCourseOffline,
  getAllCachedCourses,
  type OfflineCourse,
} from '@/lib/offline';

// ── Per-course hook ───────────────────────────────────────────────────────────

export function useOfflineCourse(courseId: string) {
  const [isCached, setIsCached] = useState(false);
  const [saving, setSaving] = useState(false);
  const available = Platform.OS !== 'web';

  useEffect(() => {
    if (!available || !courseId) return;
    isCourseDownloaded(courseId).then(setIsCached);
  }, [courseId, available]);

  const download = useCallback(async (): Promise<boolean> => {
    if (!available || !hasSupabaseEnv || !courseId) return false;
    setSaving(true);

    // Fetch course + questions from Supabase
    const [courseRes, questionsRes] = await Promise.all([
      (supabase as any).from('courses').select('*').eq('id', courseId).single(),
      (supabase as any).from('questions').select('*').eq('course_id', courseId),
    ]);

    if (courseRes.error || !courseRes.data) {
      setSaving(false);
      return false;
    }

    const c = courseRes.data as any;
    const qs: any[] = questionsRes.data ?? [];

    await saveCourseOffline(
      {
        id: c.id, title: c.title, description: c.description ?? null,
        track: c.track ?? null, ceu_value: c.ceu_value ?? 0,
        pass_score: c.pass_score ?? 80, duration_seconds: c.duration_seconds ?? null,
        video_url: c.video_url ?? null, is_published: c.is_published ?? true,
      },
      qs.map((q) => ({
        id: q.id, course_id: q.course_id, question: q.question,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options ?? '[]'),
        answer: q.answer, domain: q.domain ?? null,
      })),
    );

    setIsCached(true);
    setSaving(false);
    return true;
  }, [available, courseId]);

  const remove = useCallback(async (): Promise<void> => {
    if (!available || !courseId) return;
    await removeCourseOffline(courseId);
    setIsCached(false);
  }, [available, courseId]);

  return { isCached, saving, download, remove, available };
}

// ── Saved-courses list hook ───────────────────────────────────────────────────

export function useOfflineCourseList() {
  const [courses, setCourses] = useState<OfflineCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const available = Platform.OS !== 'web';

  const refresh = useCallback(async () => {
    if (!available) { setLoading(false); return; }
    const list = await getAllCachedCourses();
    setCourses(list);
    setLoading(false);
  }, [available]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { courses, loading, refresh };
}
