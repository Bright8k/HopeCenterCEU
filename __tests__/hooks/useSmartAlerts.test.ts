import { renderHook, waitFor, act } from '@testing-library/react-native';
import { createMockSupabase } from '../__helpers__/mockSupabase';

// Static factory — no out-of-scope variable references allowed by jest.mock hoisting
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// These start with 'mock' so babel-jest allows them in factory closures
const mockAuthState = { user: { id: 'user-1' }, role: 'BCBA' as const };
const mockProfileState = { profile: { renewal_date: null as string | null }, loading: false };

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => mockProfileState,
}));

// Inline factory — no variable reference, avoids TDZ issue entirely
jest.mock('@/lib/supabase', () => ({
  hasSupabaseEnv: true,
  supabase: { from: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';

const mockFrom = supabase.from as jest.Mock;

const renewalInDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

describe('useSmartAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.role = 'BCBA';
    mockProfileState.profile.renewal_date = null;
    const mock = createMockSupabase({ courses: { data: null, count: 0, error: null } });
    mockFrom.mockImplementation(mock.supabase.from);
  });

  it('produces no alerts when no deadline and no new courses', async () => {
    const { result } = await renderHook(() => useSmartAlerts());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    expect(result.current.alerts).toHaveLength(0);
  });

  it('shows a renewal alert when deadline is within 30 days', async () => {
    mockProfileState.profile.renewal_date = renewalInDays(15);
    const mock = createMockSupabase({ courses: { data: null, count: 0, error: null } });
    mockFrom.mockImplementation(mock.supabase.from);

    const { result } = await renderHook(() => useSmartAlerts());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    const renewal = result.current.alerts.find((a) => a.type === 'renewal');
    expect(renewal).toBeDefined();
    expect(renewal?.title).toMatch(/15 day/i);
  });

  it('does not show a renewal alert for STUDENT role', async () => {
    (mockAuthState as any).role = 'STUDENT';
    mockProfileState.profile.renewal_date = renewalInDays(10);
    const mock = createMockSupabase({ courses: { data: null, count: 0, error: null } });
    mockFrom.mockImplementation(mock.supabase.from);

    const { result } = await renderHook(() => useSmartAlerts());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    expect(result.current.alerts.find((a) => a.type === 'renewal')).toBeUndefined();
  });

  it('shows a new courses alert when recent courses exist', async () => {
    const mock = createMockSupabase({ courses: { data: null, count: 3, error: null } });
    mockFrom.mockImplementation(mock.supabase.from);

    const { result } = await renderHook(() => useSmartAlerts());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    const newCourses = result.current.alerts.find((a) => a.type === 'new_courses');
    expect(newCourses).toBeDefined();
    expect(newCourses?.title).toMatch(/3 new/i);
  });

  it('removes an alert after calling dismiss()', async () => {
    const mock = createMockSupabase({ courses: { data: null, count: 2, error: null } });
    mockFrom.mockImplementation(mock.supabase.from);

    const { result } = await renderHook(() => useSmartAlerts());
    // Use expect() so waitFor retries until the assertion passes
    await waitFor(() => expect(result.current.alerts.length).toBeGreaterThan(0));

    const id = result.current.alerts[0].id;
    await act(async () => { result.current.dismiss(id); });
    await waitFor(() => expect(result.current.alerts.find((a) => a.id === id)).toBeUndefined());
  });

  it('does not show renewal alert when deadline is more than 30 days away', async () => {
    mockProfileState.profile.renewal_date = renewalInDays(45);
    // count=1 gives a new_courses alert to wait on — proves the effect actually ran
    const mock = createMockSupabase({ courses: { data: null, count: 1, error: null } });
    mockFrom.mockImplementation(mock.supabase.from);

    const { result } = await renderHook(() => useSmartAlerts());
    await waitFor(() => expect(result.current.alerts.find((a) => a.type === 'new_courses')).toBeDefined());
    expect(result.current.alerts.find((a) => a.type === 'renewal')).toBeUndefined();
  });
});
