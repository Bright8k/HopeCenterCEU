import { renderHook, waitFor } from '@testing-library/react-native';
import { createMockSupabase } from '../__helpers__/mockSupabase';

jest.mock('@/lib/supabase', () => ({
  hasSupabaseEnv: true,
  supabase: { from: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { useAceChecklist } from '@/hooks/useAceChecklist';
import { MANUAL_ACE_TASKS } from '@/constants/aceChecklist';

const mockFrom = supabase.from as jest.Mock;

const settings = {
  id: true,
  provider_name: 'Hope Center for Behavior Change',
  provider_number: null as string | null,
  coordinator_name: null as string | null,
  coordinator_email: null as string | null,
  approval_expires_on: null as string | null,
  checklist: { apply_ace: true } as Record<string, boolean>,
  updated_at: '2026-11-16T00:00:00Z',
};

const goodCourse = {
  id: 'good', title: 'Good', track: 'BCBA', ceu_value: 1, duration_seconds: 3000,
  instructor_name: 'Dr. A', learning_objectives: 'Do X', status: 'published',
};
const badCourse = { ...goodCourse, id: 'bad', title: 'Bad', instructor_name: null };
const studyLesson = { ...goodCourse, id: 'study', title: 'Study', ceu_value: 0, instructor_name: null };

function setup(overrides: Partial<typeof settings> = {}, missingBacb = 2) {
  mockFrom.mockImplementation(
    createMockSupabase({
      ace_settings: { data: { ...settings, ...overrides }, error: null },
      courses: { data: [goodCourse, badCourse, studyLesson], error: null },
      questions: { data: [1, 2, 3].flatMap(() => [{ course_id: 'good' }, { course_id: 'bad' }]), error: null },
      profiles: { data: null, count: missingBacb, error: null },
    }).supabase.from,
  );
}

describe('useAceChecklist', () => {
  beforeEach(() => jest.clearAllMocks());

  it('flags missing provider details, non-compliant courses, and learners without BACB numbers', async () => {
    setup();
    const { result } = await renderHook(() => useAceChecklist());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const byKey = Object.fromEntries(result.current.items.map((i) => [i.key, i]));
    expect(byKey.provider_number.done).toBe(false);
    expect(byKey.coordinator.done).toBe(false);
    expect(byKey.course_compliance.done).toBe(false);
    expect(result.current.courseIssues).toEqual([{ id: 'bad', title: 'Bad', issues: ['No instructor listed'] }]);
    expect(byKey.learner_bacb.title).toMatch(/^2 RBT\/BCBA learners have/);
    expect(byKey.apply_ace.done).toBe(true);
    expect(result.current.items).toHaveLength(5 + MANUAL_ACE_TASKS.length);
  });

  it('treats an expired approval as not done', async () => {
    setup({ provider_number: 'OP-1', coordinator_name: 'C', coordinator_email: 'c@example.com', approval_expires_on: '2020-01-01' }, 0);
    const { result } = await renderHook(() => useAceChecklist());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const byKey = Object.fromEntries(result.current.items.map((i) => [i.key, i]));
    expect(byKey.provider_number.done).toBe(true);
    expect(byKey.coordinator.done).toBe(true);
    expect(byKey.approval_expires.done).toBe(false);
    expect(byKey.approval_expires.detail).toMatch(/expired/);
    expect(byKey.learner_bacb.done).toBe(true);
  });
});
