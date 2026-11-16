import { useCallback, useEffect, useMemo, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { courseComplianceIssues } from '@/lib/ace';
import { MANUAL_ACE_TASKS } from '@/constants/aceChecklist';
import { useAceSettings } from '@/hooks/useAceSettings';
import type { Database } from '@/types/database';

type CourseRow = Database['public']['Tables']['courses']['Row'];
type ComplianceCourse = Pick<
  CourseRow,
  'id' | 'title' | 'track' | 'ceu_value' | 'duration_seconds' | 'instructor_name' | 'learning_objectives' | 'status'
>;

export interface AceChecklistItem {
  key: string;
  title: string;
  detail: string;
  done: boolean;
  manual: boolean;
}

export interface CourseIssue {
  id: string;
  title: string;
  issues: string[];
}

export function useAceChecklist() {
  const { settings, loading: settingsLoading, save } = useAceSettings();
  const [courseIssues, setCourseIssues] = useState<CourseIssue[]>([]);
  const [missingBacb, setMissingBacb] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }
    Promise.all([
      supabase
        .from('courses')
        .select('id, title, track, ceu_value, duration_seconds, instructor_name, learning_objectives, status')
        .neq('status', 'archived'),
      supabase.from('questions').select('course_id'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['RBT', 'BCBA']).is('bacb_cert_number', null),
    ]).then(([courses, questions, profiles]) => {
      if (!active) return;
      const counts = new Map<string, number>();
      for (const q of (questions.data as { course_id: string }[] | null) ?? []) {
        counts.set(q.course_id, (counts.get(q.course_id) ?? 0) + 1);
      }
      const issues = ((courses.data as ComplianceCourse[] | null) ?? [])
        .map((c) => ({ id: c.id, title: c.title, issues: courseComplianceIssues(c, counts.get(c.id) ?? 0) }))
        .filter((c) => c.issues.length > 0);
      setCourseIssues(issues);
      setMissingBacb(profiles.count ?? 0);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const items = useMemo<AceChecklistItem[]>(() => {
    if (!settings) return [];
    const today = new Date().toISOString().slice(0, 10);
    const auto: AceChecklistItem[] = [
      {
        key: 'provider_number',
        title: 'Enter the ACE provider number',
        detail: 'Printed on every certificate. Until it is entered, certificates say approval is pending and are not valid for BACB credit.',
        done: !!settings.provider_number,
        manual: false,
      },
      {
        key: 'coordinator',
        title: 'Enter the ACE Coordinator’s name and contact email',
        detail: 'The name is printed on certificates; the email is shown to learners as the complaint contact.',
        done: !!settings.coordinator_name && !!settings.coordinator_email,
        manual: false,
      },
      {
        key: 'approval_expires',
        title: 'Record when ACE approval expires',
        detail: settings.approval_expires_on && settings.approval_expires_on < today
          ? 'Approval has expired — renew it and update the date.'
          : 'Approval renews every year.',
        done: !!settings.approval_expires_on && settings.approval_expires_on >= today,
        manual: false,
      },
      {
        key: 'course_compliance',
        title: courseIssues.length
          ? `Fix ${courseIssues.length} credit-bearing course${courseIssues.length === 1 ? '' : 's'}`
          : 'Credit-bearing courses meet ACE rules',
        detail: 'Each needs an instructor, learning objectives, a duration that supports its credit, and 3 quiz questions per credit.',
        done: courseIssues.length === 0,
        manual: false,
      },
      {
        key: 'learner_bacb',
        title: missingBacb
          ? `${missingBacb} RBT/BCBA learner${missingBacb === 1 ? ' has' : 's have'} no BACB certification number`
          : 'Every RBT/BCBA learner has a BACB certification number',
        detail: 'Learners add it under Edit Profile. Certificates require it once the provider number is entered.',
        done: missingBacb === 0,
        manual: false,
      },
    ];
    const manual = MANUAL_ACE_TASKS.map((t) => ({ ...t, done: !!settings.checklist?.[t.key], manual: true }));
    return [...auto, ...manual];
  }, [settings, courseIssues, missingBacb]);

  const toggleManual = useCallback(
    (key: string) => {
      if (!settings) return Promise.resolve('Settings are still loading.');
      return save({ checklist: { ...settings.checklist, [key]: !settings.checklist?.[key] } });
    },
    [settings, save],
  );

  return {
    items,
    courseIssues,
    settings,
    save,
    toggleManual,
    loading: loading || settingsLoading,
    remaining: items.filter((i) => !i.done).length,
  };
}
