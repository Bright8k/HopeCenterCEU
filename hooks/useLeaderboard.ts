import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
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

  const load = useCallback(async () => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // supabase.rpc lacks TypeScript generics for custom functions — cast to any
    const { data, error } = await (supabase as any).rpc('get_leaderboard', {
      p_role: roleFilter === 'ALL' ? null : roleFilter,
      p_since: periodToDate(period),
    }) as { data: any[] | null; error: any };

    if (!error && data) {
      setEntries(
        data.map((row) => ({
          userId: row.user_id as string,
          displayName: row.display_name as string,
          avatarUrl: (row.avatar_url as string | null) ?? null,
          role: row.role as string,
          totalCeus: row.total_ceus as number,
          completionsCount: row.completions_count as number,
          currentStreak: row.current_streak as number,
          longestStreak: row.longest_streak as number,
        })),
      );
    }
    setLoading(false);
  }, [roleFilter, period]);

  const refetch = useCallback(() => load(), [load]);

  // Re-fetch on filter change or when completions/streaks are written
  useEffect(() => {
    void load();
  }, [load]);

  // Realtime — any new completion or streak update triggers a leaderboard refresh
  useEffect(() => {
    if (!hasSupabaseEnv) return;

    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'completions' }, () => void load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'streaks' }, () => void load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'streaks' }, () => void load())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  return { entries, loading, refetch };
}
