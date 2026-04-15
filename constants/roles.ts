export type UserRole = 'RBT' | 'BCBA' | 'STUDENT';

export const ROLE_LABELS: Record<UserRole, string> = {
  RBT: 'Registered Behavior Technician',
  BCBA: 'Board Certified Behavior Analyst',
  STUDENT: 'Student Analyst',
};

export const ROLE_CEU_REQUIREMENTS: Record<
  UserRole,
  { total: number; cycleYears: number; description: string }
> = {
  RBT: {
    total: 12,
    cycleYears: 2,
    description: '12 professional development units every 2 years',
  },
  BCBA: {
    total: 32,
    cycleYears: 2,
    description: '32 CEUs every 2 years (4 ethics, 3 supervision)',
  },
  STUDENT: {
    total: 0,
    cycleYears: 0,
    description: 'BCBA exam preparation',
  },
};
