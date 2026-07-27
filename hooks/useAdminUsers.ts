import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

export interface AdminUserSummary {
  id: string;
  displayName: string;
  role: string;
  renewalDate: string | null;
  totalCompletions: number;
  totalCeus: number;
  currentStreak: number;
}

export interface AdminUserDetail {
  id: string;
  displayName: string;
  role: string;
  renewalDate: string | null;
  currentStreak: number;
  longestStreak: number;
  completions: AdminUserCompletion[];
}

export interface AdminUserCompletion {
  id: string;
  courseTitle: string;
  ceuValue: number;
  score: number;
  passed: boolean;
  completedAt: string;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv) { setLoading(false); return; }
    let active = true;

    async function run() {
      const [profilesRes, completionsRes, streaksRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, role, renewal_date').not('role', 'is', null),
        // relational join syntax (courses(ceu_value)) requires as any until Supabase generates relationship types
        (supabase as any).from('completions').select('user_id, passed, courses(ceu_value)'),
        supabase.from('streaks').select('user_id, current_streak'),
      ]);

      if (!active) return;

      const profiles = profilesRes.data ?? [];
      const completions: any[] = completionsRes.data ?? [];
      const streaks = streaksRes.data ?? [];

      const streakMap: Record<string, number> = {};
      for (const s of streaks) streakMap[s.user_id] = s.current_streak;

      const compMap: Record<string, { count: number; ceus: number }> = {};
      for (const c of completions) {
        const uid = c.user_id as string;
        if (!compMap[uid]) compMap[uid] = { count: 0, ceus: 0 };
        if (c.passed) {
          compMap[uid].count++;
          compMap[uid].ceus += (c.courses?.ceu_value as number) ?? 0;
        }
      }

      const list: AdminUserSummary[] = profiles.map((p) => ({
        id: p.id,
        displayName: p.display_name ?? 'Learner',
        role: p.role ?? 'Unknown',
        renewalDate: p.renewal_date,
        totalCompletions: compMap[p.id]?.count ?? 0,
        totalCeus: compMap[p.id]?.ceus ?? 0,
        currentStreak: streakMap[p.id] ?? 0,
      }));

      // Sort by most active first
      list.sort((a, b) => b.totalCompletions - a.totalCompletions);

      setUsers(list);
      setLoading(false);
    }

    void run();
    return () => { active = false; };
  }, []);

  return { users, loading };
}

export function useAdminUserDetail(userId: string) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!hasSupabaseEnv || !userId) { setLoading(false); return; }
    let active = true;

    async function run() {
      const [profileRes, completionsRes, streakRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, role, renewal_date').eq('id', userId).single(),
        // relational join syntax requires as any until Supabase generates relationship types
        (supabase as any)
          .from('completions')
          .select('id, passed, score, completed_at, courses(title, ceu_value)')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false }),
        supabase.from('streaks').select('current_streak, longest_streak').eq('user_id', userId).maybeSingle(),
      ]);

      if (!active) return;

      const p = profileRes.data;
      const streak = streakRes.data;

      const completions: AdminUserCompletion[] = ((completionsRes.data as any[]) ?? []).map((c) => ({
        id: c.id as string,
        courseTitle: (c.courses?.title as string) ?? 'Untitled',
        ceuValue: (c.courses?.ceu_value as number) ?? 0,
        score: c.score as number,
        passed: c.passed as boolean,
        completedAt: c.completed_at as string,
      }));

      setDetail({
        id: userId,
        displayName: p?.display_name ?? 'Learner',
        role: p?.role ?? 'Unknown',
        renewalDate: p?.renewal_date ?? null,
        currentStreak: streak?.current_streak ?? 0,
        longestStreak: streak?.longest_streak ?? 0,
        completions,
      });
      setLoading(false);
    }

    void run();
    return () => { active = false; };
  }, [userId, tick]);

  return { detail, loading, refetch };
}
