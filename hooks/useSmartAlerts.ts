import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export interface SmartAlert {
  id: string;
  type: 'renewal' | 'new_courses';
  title: string;
  body: string;
  icon: string;
  actionLabel?: string;
  actionRoute?: string;
}

const DISMISSED_KEY = 'smart_alerts_dismissed_v1';

async function loadDismissed(): Promise<Set<string>> {
  try {
    const raw = await SecureStore.getItemAsync(DISMISSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

async function saveDismissed(ids: Set<string>) {
  try {
    await SecureStore.setItemAsync(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

export function useSmartAlerts() {
  const { user, role } = useAuth();
  const { profile } = useProfile();
  const [allAlerts, setAllAlerts] = useState<SmartAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  // Load dismissed IDs from secure store once
  useEffect(() => {
    loadDismissed().then((ids) => { setDismissed(ids); setReady(true); });
  }, []);

  // Build alert list whenever profile or role changes
  useEffect(() => {
    if (!user || !hasSupabaseEnv) return;

    let active = true;

    async function build() {
      const result: SmartAlert[] = [];

      // Renewal deadline alert (RBT / BCBA only)
      if (profile?.renewal_date && role !== 'STUDENT') {
        const daysLeft = Math.ceil(
          (new Date(profile.renewal_date).getTime() - Date.now()) / 86_400_000,
        );
        if (daysLeft > 0 && daysLeft <= 30) {
          result.push({
            id: 'renewal',
            type: 'renewal',
            title: `Renewal in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
            body: 'Your CEU cycle ends soon — stay on track to meet your requirement.',
            icon: 'calendar-outline',
            actionLabel: 'View tracker',
            actionRoute: '/renewal-tracker',
          });
        }
      }

      // New courses this week relevant to this user's track
      const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
      let q = supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('created_at', weekAgo);
      if (role && role !== 'STUDENT') {
        q = q.or(`track.is.null,track.eq.${role}`);
      }
      const { count } = await q;
      if (count && count > 0) {
        const weekTag = weekAgo.slice(0, 10);
        result.push({
          id: `new_courses_${weekTag}`,
          type: 'new_courses',
          title: `${count} new course${count === 1 ? '' : 's'} this week`,
          body: `New ${role ? role + ' ' : ''}content was just added to the library.`,
          icon: 'sparkles-outline',
          actionLabel: 'Browse',
          actionRoute: '/(tabs)/courses',
        });
      }

      if (active) setAllAlerts(result);
    }

    build();
    return () => { active = false; };
  }, [user?.id, role, profile?.renewal_date]);

  const visible = ready ? allAlerts.filter((a) => !dismissed.has(a.id)) : [];

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }

  return { alerts: visible, dismiss };
}
