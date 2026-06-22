import { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { ROLE_CEU_REQUIREMENTS } from '@/constants/roles';

export type RenewalStatus = 'complete' | 'ahead' | 'on_track' | 'behind' | 'overdue' | 'no_date';

export type RenewalCompletion = {
  id: string;
  title: string;
  ceuValue: number;
  category: 'ethics' | 'supervision' | 'general' | null;
  completedAt: string;
};

export type CategoryBreakdown = {
  ethics: number;
  supervision: number;
  general: number;
};

export type CEURenewalData = {
  renewalDate: string | null;
  daysRemaining: number | null;
  timeElapsedPercent: number;
  earnedCeus: number;
  requiredCeus: number;
  ceuPercent: number;
  status: RenewalStatus;
  completions: RenewalCompletion[];
  categoryBreakdown: CategoryBreakdown;
};

export function useCEURenewal() {
  const { user, role } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [data, setData] = useState<CEURenewalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading) return;

    if (!hasSupabaseEnv || !user || !role || role === 'STUDENT') {
      setLoading(false);
      return;
    }

    let active = true;

    async function run() {
      const req = ROLE_CEU_REQUIREMENTS[role!];
      const renewalDate = profile?.renewal_date ?? null;

      let daysRemaining: number | null = null;
      let timeElapsedPercent = 0;
      let cycleStartIso: string | null = null;

      if (renewalDate) {
        const today = new Date();
        const renewal = new Date(renewalDate);
        const msPerDay = 86_400_000;

        daysRemaining = Math.floor((renewal.getTime() - today.getTime()) / msPerDay);

        const cycleStart = new Date(renewal);
        cycleStart.setFullYear(cycleStart.getFullYear() - req.cycleYears);
        cycleStartIso = cycleStart.toISOString().slice(0, 10);

        const totalDays = (renewal.getTime() - cycleStart.getTime()) / msPerDay;
        const elapsedDays = (today.getTime() - cycleStart.getTime()) / msPerDay;
        timeElapsedPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
      }

      // Fetch passed completions in this cycle (include category for BCBA breakdown)
      let query = (supabase as any)
        .from('completions')
        .select('id, completed_at, courses(title, ceu_value, category)')
        .eq('user_id', user!.id)
        .eq('passed', true)
        .order('completed_at', { ascending: false });

      if (cycleStartIso) {
        query = query.gte('completed_at', cycleStartIso);
      }

      const { data: rows } = await query;

      const completions: RenewalCompletion[] = ((rows as any[]) ?? []).map((c: any) => ({
        id: c.id,
        title: c.courses?.title ?? 'Untitled course',
        ceuValue: c.courses?.ceu_value ?? 0,
        category: (c.courses?.category as RenewalCompletion['category']) ?? null,
        completedAt: c.completed_at,
      }));

      const earnedCeus = completions.reduce((sum, c) => sum + c.ceuValue, 0);

      const categoryBreakdown: CategoryBreakdown = { ethics: 0, supervision: 0, general: 0 };
      for (const c of completions) {
        if (c.category === 'ethics') categoryBreakdown.ethics += c.ceuValue;
        else if (c.category === 'supervision') categoryBreakdown.supervision += c.ceuValue;
        else categoryBreakdown.general += c.ceuValue;
      }
      const requiredCeus = req.total;
      const ceuPercent = requiredCeus > 0 ? Math.min(100, (earnedCeus / requiredCeus) * 100) : 0;

      let status: RenewalStatus = 'no_date';
      if (renewalDate) {
        if (daysRemaining !== null && daysRemaining < 0) {
          status = 'overdue';
        } else if (earnedCeus >= requiredCeus) {
          status = 'complete';
        } else if (ceuPercent >= timeElapsedPercent + 10) {
          status = 'ahead';
        } else if (ceuPercent >= timeElapsedPercent - 10) {
          status = 'on_track';
        } else {
          status = 'behind';
        }
      }

      if (active) {
        setData({ renewalDate, daysRemaining, timeElapsedPercent, earnedCeus, requiredCeus, ceuPercent, status, completions, categoryBreakdown });
        setLoading(false);
      }
    }

    run();
    return () => { active = false; };
  }, [user, role, profile, profileLoading]);

  return { data, loading };
}
