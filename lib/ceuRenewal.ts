export type RenewalStatus = 'complete' | 'ahead' | 'on_track' | 'behind' | 'overdue' | 'no_date';

/**
 * Pure status calculation for the CEU renewal progress tracker.
 * Compares percentage of CEUs earned against percentage of time elapsed.
 */
export function calcRenewalStatus({
  daysRemaining,
  earnedCeus,
  requiredCeus,
  timeElapsedPercent,
}: {
  daysRemaining: number | null;
  earnedCeus: number;
  requiredCeus: number;
  timeElapsedPercent: number;
}): RenewalStatus {
  if (daysRemaining === null) return 'no_date';
  if (daysRemaining < 0) return 'overdue';
  if (earnedCeus >= requiredCeus) return 'complete';
  const ceuPercent = requiredCeus > 0 ? (earnedCeus / requiredCeus) * 100 : 0;
  if (ceuPercent >= timeElapsedPercent + 10) return 'ahead';
  if (ceuPercent >= timeElapsedPercent - 10) return 'on_track';
  return 'behind';
}
