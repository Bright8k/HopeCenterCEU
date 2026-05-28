import { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

export type AnalyticsPeriod = 'month' | 'year' | 'all';

export interface CourseStat {
  courseId: string;
  title: string;
  track: string | null;
  ceuValue: number;
  attempts: number;
  passes: number;
  passRate: number;
  avgScore: number;
}

export interface RecentCompletion {
  id: string;
  userId: string;
  displayName: string;
  role: string | null;
  courseTitle: string;
  score: number;
  passed: boolean;
  completedAt: string;
}

export interface AnalyticsSummary {
  totalAttempts: number;
  passRate: number;
  uniqueLearners: number;
  ceusAwarded: number;
}

export interface AdminAnalytics {
  summary: AnalyticsSummary;
  courseStats: CourseStat[];
  recentCompletions: RecentCompletion[];
}

function periodCutoff(period: AnalyticsPeriod): string | null {
  if (period === 'all') return null;
  const d = new Date();
  if (period === 'year') d.setMonth(0, 1);
  else d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useAdminAnalytics(period: AnalyticsPeriod = 'month') {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    async function run() {
      const cutoff = periodCutoff(period);

      // Fetch completions with course data
      let q = (supabase as any)
        .from('completions')
        .select('id, user_id, passed, score, completed_at, courses(id, title, ceu_value, track)')
        .order('completed_at', { ascending: false })
        .limit(1000);
      if (cutoff) q = q.gte('completed_at', cutoff);

      const { data: rows } = await q;
      if (!active) return;

      const completions: any[] = rows ?? [];

      // Fetch profiles for the users in this result set
      const userIds = [...new Set<string>(completions.map((c) => c.user_id as string))];
      let profileMap: Record<string, { displayName: string; role: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from('profiles')
          .select('id, display_name, role')
          .in('id', userIds);
        for (const p of (profiles as any[]) ?? []) {
          profileMap[p.id as string] = {
            displayName: (p.display_name as string | null) ?? 'Learner',
            role: p.role as string | null,
          };
        }
      }

      // Aggregate summary
      const totalAttempts = completions.length;
      const passes = completions.filter((c) => c.passed).length;
      const passRate = totalAttempts > 0 ? Math.round((passes / totalAttempts) * 100) : 0;
      const uniqueLearners = userIds.length;
      const ceusAwarded = completions
        .filter((c) => c.passed)
        .reduce((sum, c) => sum + ((c.courses?.ceu_value as number) ?? 0), 0);

      // Aggregate course stats
      const courseMap: Record<string, CourseStat> = {};
      for (const c of completions) {
        const cid = (c.courses?.id ?? c.course_id) as string;
        if (!cid) continue;
        if (!courseMap[cid]) {
          courseMap[cid] = {
            courseId: cid,
            title: (c.courses?.title as string) ?? 'Untitled',
            track: (c.courses?.track as string | null) ?? null,
            ceuValue: (c.courses?.ceu_value as number) ?? 0,
            attempts: 0,
            passes: 0,
            passRate: 0,
            avgScore: 0,
          };
        }
        courseMap[cid].attempts++;
        if (c.passed) courseMap[cid].passes++;
        courseMap[cid].avgScore += c.score as number;
      }
      const courseStats: CourseStat[] = Object.values(courseMap).map((cs) => ({
        ...cs,
        passRate: cs.attempts > 0 ? Math.round((cs.passes / cs.attempts) * 100) : 0,
        avgScore: cs.attempts > 0 ? Math.round(cs.avgScore / cs.attempts) : 0,
      }));
      courseStats.sort((a, b) => b.attempts - a.attempts);

      // Recent completions (last 15)
      const recentCompletions: RecentCompletion[] = completions.slice(0, 15).map((c) => ({
        id: c.id as string,
        userId: c.user_id as string,
        displayName: profileMap[c.user_id as string]?.displayName ?? 'Learner',
        role: profileMap[c.user_id as string]?.role ?? null,
        courseTitle: (c.courses?.title as string) ?? 'Untitled',
        score: c.score as number,
        passed: c.passed as boolean,
        completedAt: c.completed_at as string,
      }));

      if (active) {
        setData({
          summary: { totalAttempts, passRate, uniqueLearners, ceusAwarded },
          courseStats,
          recentCompletions,
        });
        setLoading(false);
      }
    }

    void run();
    return () => { active = false; };
  }, [period]);

  return { data, loading };
}
