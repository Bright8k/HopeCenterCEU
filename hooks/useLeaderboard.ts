import { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  role: string;
  totalCeus: number;
  completionsCount: number;
  currentStreak: number;
  longestStreak: number;
}

export type LeaderboardPeriod = 'all' | 'year' | 'month';
export type LeaderboardRole = 'ALL' | 'RBT' | 'BCBA';

function periodToDate(period: LeaderboardPeriod): string | null {
  if (period === 'all') return null;
  const d = new Date();
  if (period === 'year') d.setMonth(0, 1);
  else d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function useLeaderboard(
  roleFilter: LeaderboardRole = 'ALL',
  period: LeaderboardPeriod = 'all',
) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    // supabase.rpc lacks TypeScript generics for custom functions — cast to any
    (supabase as any)
      .rpc('get_leaderboard', {
        p_role: roleFilter === 'ALL' ? null : roleFilter,
        p_since: periodToDate(period),
      })
      .then(({ data, error }: { data: any[] | null; error: any }) => {
        if (!active) return;
        if (!error && data) {
          setEntries(
            data.map((row) => ({
              userId: row.user_id as string,
              displayName: row.display_name as string,
              role: row.role as string,
              totalCeus: row.total_ceus as number,
              completionsCount: row.completions_count as number,
              currentStreak: row.current_streak as number,
              longestStreak: row.longest_streak as number,
            })),
          );
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [roleFilter, period]);

  return { entries, loading };
}
