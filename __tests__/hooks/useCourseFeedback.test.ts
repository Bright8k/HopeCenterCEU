import { renderHook, waitFor, act } from '@testing-library/react-native';
import { createMockSupabase } from '../__helpers__/mockSupabase';

const mockAuthState = { user: { id: 'user-1' } as { id: string } | null };

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));
jest.mock('@/lib/supabase', () => ({
  hasSupabaseEnv: true,
  supabase: { from: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { useCourseFeedback } from '@/hooks/useCourseFeedback';

const mockFrom = supabase.from as jest.Mock;

const saved = {
  id: 'fb-1', user_id: 'user-1', course_id: 'course-1', rating: 4, comments: 'Clear examples',
  created_at: '2026-11-20T00:00:00Z', updated_at: '2026-11-20T00:00:00Z',
};

function setup(tables: Parameters<typeof createMockSupabase>[0]) {
  mockFrom.mockImplementation(createMockSupabase(tables).supabase.from);
}

describe('useCourseFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.user = { id: 'user-1' };
  });

  it('is not offered before the learner completes the course', async () => {
    setup({ completions: { data: [], error: null }, course_feedback: { data: null, error: null } });
    const { result } = await renderHook(() => useCourseFeedback('course-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.completed).toBe(false);
    expect(result.current.feedback).toBeNull();
  });

  it('loads existing feedback for a completed course', async () => {
    setup({ completions: { data: [{ id: 'c-1' }], error: null }, course_feedback: { data: saved, error: null } });
    const { result } = await renderHook(() => useCourseFeedback('course-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.completed).toBe(true);
    expect(result.current.feedback?.rating).toBe(4);
  });

  it('saves feedback and reports success', async () => {
    setup({
      completions: { data: [{ id: 'c-1' }], error: null },
      course_feedback: [{ data: null, error: null }, { data: { ...saved, rating: 5 }, error: null }],
    });
    const { result } = await renderHook(() => useCourseFeedback('course-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok = false;
    await act(async () => { ok = await result.current.submit(5, '  Great  '); });
    expect(ok).toBe(true);
    expect(result.current.feedback?.rating).toBe(5);
    expect(result.current.error).toBeNull();
  });

  it('shows a friendly error when saving fails', async () => {
    setup({
      completions: { data: [{ id: 'c-1' }], error: null },
      course_feedback: [{ data: null, error: null }, { data: null, error: { message: 'rls violation' } }],
    });
    const { result } = await renderHook(() => useCourseFeedback('course-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok = true;
    await act(async () => { ok = await result.current.submit(3, ''); });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('Your feedback could not be sent. Try again.');
  });

  it('does nothing when signed out', async () => {
    mockAuthState.user = null;
    setup({});
    const { result } = await renderHook(() => useCourseFeedback('course-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
