import { Platform } from 'react-native';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

/**
 * Increments the calling user's daily streak by one when called for the first time
 * on a given calendar day. Consecutive-day logic:
 *   - Same day as last_activity_date → no-op (already counted today)
 *   - Yesterday                      → increment current_streak
 *   - Earlier / never               → reset current_streak to 1
 */
export async function updateStreak(userId: string): Promise<void> {
  if (!hasSupabaseEnv || Platform.OS === 'web') return;

  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await (supabase as any)
    .from('streaks')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .maybeSingle();

  // Already recorded an activity today — nothing to update
  if (existing?.last_activity_date === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const prevStreak = (existing?.current_streak as number | undefined) ?? 0;
  const newStreak =
    existing?.last_activity_date === yesterdayStr ? prevStreak + 1 : 1;

  const newLongest = Math.max(
    newStreak,
    (existing?.longest_streak as number | undefined) ?? 0,
  );

  await (supabase as any).from('streaks').upsert({
    user_id: userId,
    current_streak: newStreak,
    longest_streak: newLongest,
    last_activity_date: today,
    updated_at: new Date().toISOString(),
  });
}
