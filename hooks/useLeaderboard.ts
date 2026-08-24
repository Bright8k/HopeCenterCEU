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
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_role: roleFilter === 'ALL' ? null : roleFilter,
      p_since: periodToDate(period),
    });

    if (!error && data) {
      setEntries(
        data.map((row) => ({
          userId: row.user_id,
          displayName: row.display_name,
          avatarUrl: row.avatar_url ?? null,
          role: row.role,
          totalCeus: row.total_ceus,
          completionsCount: row.completions_count,
          currentStreak: row.current_streak,
          longestStreak: row.longest_streak,
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
      .channel(`leaderboard-live-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'completions' }, () => void load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'streaks' }, () => void load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'streaks' }, () => void load())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  return { entries, loading, refetch };
}
