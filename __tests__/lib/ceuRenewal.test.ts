import { calcRenewalStatus } from '@/lib/ceuRenewal';

describe('calcRenewalStatus', () => {
  it('returns no_date when daysRemaining is null', () => {
    expect(calcRenewalStatus({ daysRemaining: null, earnedCeus: 0, requiredCeus: 20, timeElapsedPercent: 50 }))
      .toBe('no_date');
  });

  it('returns overdue when daysRemaining is negative', () => {
    expect(calcRenewalStatus({ daysRemaining: -1, earnedCeus: 10, requiredCeus: 20, timeElapsedPercent: 100 }))
      .toBe('overdue');
  });

  it('returns complete when earned >= required (even with days left)', () => {
    expect(calcRenewalStatus({ daysRemaining: 30, earnedCeus: 20, requiredCeus: 20, timeElapsedPercent: 50 }))
      .toBe('complete');
    expect(calcRenewalStatus({ daysRemaining: 30, earnedCeus: 25, requiredCeus: 20, timeElapsedPercent: 50 }))
      .toBe('complete');
  });

  it('returns ahead when CEU% exceeds time% by more than 10 points', () => {
    // 15/20 = 75% CEU, 50% time elapsed → 75 >= 50+10 → ahead
    expect(calcRenewalStatus({ daysRemaining: 100, earnedCeus: 15, requiredCeus: 20, timeElapsedPercent: 50 }))
      .toBe('ahead');
  });

  it('returns on_track when CEU% is within 10 points of time%', () => {
    // 10/20 = 50% CEU, 50% time → exactly equal → on_track
    expect(calcRenewalStatus({ daysRemaining: 100, earnedCeus: 10, requiredCeus: 20, timeElapsedPercent: 50 }))
      .toBe('on_track');
    // 8/20 = 40% CEU, 48% time → 40 >= 48-10 = 38 → on_track
    expect(calcRenewalStatus({ daysRemaining: 100, earnedCeus: 8, requiredCeus: 20, timeElapsedPercent: 48 }))
      .toBe('on_track');
  });

  it('returns behind when CEU% trails time% by more than 10 points', () => {
    // 5/20 = 25% CEU, 80% time → 25 < 80-10 → behind
    expect(calcRenewalStatus({ daysRemaining: 50, earnedCeus: 5, requiredCeus: 20, timeElapsedPercent: 80 }))
      .toBe('behind');
  });

  it('returns on_track for a fresh cycle (0 CEUs, 0% time elapsed)', () => {
    expect(calcRenewalStatus({ daysRemaining: 365, earnedCeus: 0, requiredCeus: 20, timeElapsedPercent: 0 }))
      .toBe('on_track');
  });
});
