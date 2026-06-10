import { useState, useEffect } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
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
  const [tick, setTick] = useState(0);

  // Re-fetch on user/role change or when a completion row is written
  useEffect(() => {
    if (!hasSupabaseEnv || !user || !role) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    async function run() {
      const { data } = await supabase
        .from('completions')
        .select('*, courses(ceu_value)')
        .eq('user_id', user!.id)
        .eq('passed', true);

      if (!active) return;

      const earned =
        data?.reduce(
          (sum: number, c: { courses?: { ceu_value?: number } }) =>
            sum + (c.courses?.ceu_value ?? 0),
          0,
        ) ?? 0;
      const required = ROLE_CEU_REQUIREMENTS[role!].total;

      setProgress({
        earned,
        required,
        percentage: required > 0 ? Math.min(100, (earned / required) * 100) : 0,
        completedCourses: data?.length ?? 0,
      });
      setLoading(false);
    }

    void run();
    return () => { active = false; };
  }, [user?.id, role, tick]);

  // Realtime — subscribe to this user's completions
  useEffect(() => {
    if (!hasSupabaseEnv || !user) return;

    const channel = supabase
      .channel(`ceu-progress-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completions',
          filter: `user_id=eq.${user.id}`,
        },
        () => setTick((t) => t + 1),
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  return { progress, loading };
}
