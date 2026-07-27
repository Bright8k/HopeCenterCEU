import { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export function useStreak() {
  const { user } = useAuth();
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv || !user) {
      setLoading(false);
      return;
    }
    let active = true;

    supabase
      .from('streaks')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data: row }) => {
        if (!active) return;
        setData(
          row
            ? {
                currentStreak: row.current_streak,
                longestStreak: row.longest_streak,
                lastActivityDate: row.last_activity_date,
              }
            : { currentStreak: 0, longestStreak: 0, lastActivityDate: null },
        );
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  return { data, loading };
}
