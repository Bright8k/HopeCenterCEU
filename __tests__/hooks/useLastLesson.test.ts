import { renderHook, waitFor } from '@testing-library/react-native';
import { createMockSupabase } from '../__helpers__/mockSupabase';

// Static factory — no out-of-scope variable references allowed here
jest.mock('@/lib/supabase', () => ({
  hasSupabaseEnv: true,
  supabase: { from: jest.fn() },
}));
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@example.com' } }),
}));

// Import AFTER jest.mock so we get the mocked version
import { supabase } from '@/lib/supabase';
import { useLastLesson } from '@/hooks/useLastLesson';

const mockFrom = supabase.from as jest.Mock;

const mockCourse = {
  id: 'course-1', title: 'Intro to ABA', status: 'published',
  track: 'RBT', ceu_value: 1, pass_score: 80, description: null,
  video_url: null, thumbnail_url: null, duration_seconds: null,
  quiz_required: true, is_published: true, review_note: null,
  created_at: '2026-01-01', category: null,
};

describe('useLastLesson', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when the user has no view history', async () => {
    const { supabase: s } = createMockSupabase({
      course_views: { data: [], error: null },
      completions: { data: [], error: null },
    });
    mockFrom.mockImplementation(s.from);

    const { result } = await renderHook(() => useLastLesson());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lastLesson).toBeNull();
  });

  it('returns null when every viewed course has been passed', async () => {
    const { supabase: s } = createMockSupabase({
      course_views: { data: [{ course_id: 'course-1' }], error: null },
      completions: { data: [{ course_id: 'course-1' }], error: null },
    });
    mockFrom.mockImplementation(s.from);

    const { result } = await renderHook(() => useLastLesson());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lastLesson).toBeNull();
  });

  it('returns the most recently viewed incomplete course', async () => {
    // Viewed course-1 (most recent) and course-2; only course-2 is passed → course-1 is the resume target
    const { supabase: s } = createMockSupabase({
      course_views: {
        data: [{ course_id: 'course-1' }, { course_id: 'course-2' }],
        error: null,
      },
      completions: { data: [{ course_id: 'course-2' }], error: null },
      courses: { data: mockCourse, error: null },
    });
    mockFrom.mockImplementation(s.from);

    const { result } = await renderHook(() => useLastLesson());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lastLesson?.id).toBe('course-1');
    expect(result.current.lastLesson?.title).toBe('Intro to ABA');
  });

  it('returns null when the incomplete course is no longer published', async () => {
    const { supabase: s } = createMockSupabase({
      course_views: { data: [{ course_id: 'course-1' }], error: null },
      completions: { data: [], error: null },
      courses: { data: null, error: null },
    });
    mockFrom.mockImplementation(s.from);

    const { result } = await renderHook(() => useLastLesson());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lastLesson).toBeNull();
  });
});
