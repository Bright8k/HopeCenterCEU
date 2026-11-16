// BACB ACE Provider Handbook (effective 2026-07-01) rules used across the app.
// RBT courses award PDUs, BCBA/BCaBA courses award CEUs, student exam prep awards nothing.

type Track = 'RBT' | 'BCBA' | 'STUDENT' | null;

export type CreditUnit = 'CEU' | 'PDU';

export interface CourseComplianceInput {
  track: Track;
  ceu_value: number;
  duration_seconds: number | null;
  instructor_name: string | null;
  learning_objectives: string | null;
}

export function creditUnit(track: Track): CreditUnit | null {
  if (track === 'STUDENT') return null;
  return track === 'RBT' ? 'PDU' : 'CEU';
}

export function formatCredits(value: number, track: Track): string {
  const unit = creditUnit(track);
  if (!unit || value <= 0) return 'No credit';
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

/** 25 minutes = 0.5 credit; rounding up is not permitted. */
export function maxCreditsForMinutes(minutes: number): number {
  return Math.floor(minutes / 25) * 0.5;
}

export function isHalfIncrement(value: number): boolean {
  return value >= 0 && Number.isInteger(value * 2);
}

/** Asynchronous events: at least 3 knowledge-check questions per credit. */
export function minQuestionsForCredits(credits: number): number {
  return Math.ceil(credits * 3);
}

export function parseObjectives(text: string | null): string[] {
  return (text ?? '')
    .split('\n')
    .map((line) => line.replace(/^\s*[-•*\d.)]+\s*/, '').trim())
    .filter(Boolean);
}

/** Problems that keep a credit-bearing course from meeting ACE event requirements. */
export function courseComplianceIssues(course: CourseComplianceInput, questionCount: number): string[] {
  if (!creditUnit(course.track) || course.ceu_value <= 0) return [];
  const issues: string[] = [];
  if (!isHalfIncrement(course.ceu_value)) issues.push('Credit must be in 0.5 increments');
  if (!course.instructor_name?.trim()) issues.push('No instructor listed');
  if (parseObjectives(course.learning_objectives).length === 0) issues.push('No learning objectives');
  const minQuestions = minQuestionsForCredits(course.ceu_value);
  if (questionCount < minQuestions) {
    issues.push(`Needs at least ${minQuestions} quiz questions (has ${questionCount})`);
  }
  if (!course.duration_seconds) {
    issues.push('No duration set');
  } else if (course.ceu_value > maxCreditsForMinutes(course.duration_seconds / 60)) {
    issues.push(`${Math.round(course.duration_seconds / 60)} min supports at most ${maxCreditsForMinutes(course.duration_seconds / 60)} credits`);
  }
  return issues;
}
