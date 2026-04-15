import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ROLE_CEU_REQUIREMENTS } from '@/constants/roles';

export type CEUProgress = {
  earned: number;
  required: number;
  percentage: number;
  completedCourses: number;
};

export function useCEUProgress(): { progress: CEUProgress | null; loading: boolean } {
  const { user, role } = useAuth();
  const [progress, setProgress] = useState<CEUProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !role) {
      setLoading(false);
      return;
    }
    fetchProgress();
  }, [user, role]);

  async function fetchProgress() {
    setLoading(true);
    const { data } = await supabase
      .from('completions')
      .select('*, courses(ceu_value)')
      .eq('user_id', user!.id)
      .eq('passed', true);

    const earned =
      data?.reduce(
        (sum: number, c: { courses?: { ceu_value?: number } }) =>
          sum + (c.courses?.ceu_value ?? 0),
        0
      ) ?? 0;
    const required = ROLE_CEU_REQUIREMENTS[role!].total;
    const completedCourses = data?.length ?? 0;

    setProgress({
      earned,
      required,
      percentage: required > 0 ? Math.min(100, (earned / required) * 100) : 0,
      completedCourses,
    });
    setLoading(false);
  }

  return { progress, loading };
}
