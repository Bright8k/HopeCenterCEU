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

export type ComplianceCode = 'increment' | 'instructor' | 'objectives' | 'questions' | 'duration';

/**
 * Rules a credit-bearing course must meet, in a fixed order. The server copy is
 * supabase/functions/_shared/ace.ts (aceProblems); a parity test keeps them in step.
 */
export function courseComplianceCodes(course: CourseComplianceInput, questionCount: number): ComplianceCode[] {
  if (!creditUnit(course.track) || course.ceu_value <= 0) return [];
  const codes: ComplianceCode[] = [];
  if (!isHalfIncrement(course.ceu_value)) codes.push('increment');
  if (!course.instructor_name?.trim()) codes.push('instructor');
  if (parseObjectives(course.learning_objectives).length === 0) codes.push('objectives');
  if (questionCount < minQuestionsForCredits(course.ceu_value)) codes.push('questions');
  const minutes = (course.duration_seconds ?? 0) / 60;
  if (!minutes || course.ceu_value > maxCreditsForMinutes(minutes)) codes.push('duration');
  return codes;
}

/** Problems that keep a credit-bearing course from meeting ACE event requirements. */
export function courseComplianceIssues(course: CourseComplianceInput, questionCount: number): string[] {
  const minutes = (course.duration_seconds ?? 0) / 60;
  const messages: Record<ComplianceCode, string> = {
    increment: 'Credit must be in 0.5 increments',
    instructor: 'No instructor listed',
    objectives: 'No learning objectives',
    questions: `Needs at least ${minQuestionsForCredits(course.ceu_value)} quiz questions (has ${questionCount})`,
    duration: minutes
      ? `${Math.round(minutes)} min supports at most ${maxCreditsForMinutes(minutes)} credits`
      : 'No duration set',
  };
  return courseComplianceCodes(course, questionCount).map((c) => messages[c]);
}
