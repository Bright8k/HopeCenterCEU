import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export type CompletionRecord = {
  id: string;
  courseId: string;
  courseTitle: string;
  ceuValue: number;
  score: number | null;
  passed: boolean;
  certUrl: string | null;
  completedAt: string;
};

export function useCompletionHistory() {
  const { user } = useAuth();
  const [records, setRecords] = useState<CompletionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('completions')
      .select('id, course_id, score, passed, cert_url, completed_at, courses(title, ceu_value)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    setRecords(
      ((data as any[]) ?? []).map((r) => ({
        id: r.id,
        courseId: r.course_id as string,
        courseTitle: (r.courses?.title as string | undefined) ?? 'Untitled course',
        ceuValue: (r.courses?.ceu_value as number | undefined) ?? 0,
        score: r.score as number | null,
        passed: Boolean(r.passed),
        certUrl: (r.cert_url as string | null) ?? null,
        completedAt: r.completed_at as string,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { records, loading, refetch: load };
}
