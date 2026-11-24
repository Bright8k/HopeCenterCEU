// BACB ACE Provider Handbook (2026) event rules for courses that award CEUs/PDUs.
// Pure TypeScript so it runs in Deno and in Jest; __tests__/lib/aceParity.test.ts checks it
// against lib/ace.ts, the app-side copy.

export type AceProblem = 'increment' | 'instructor' | 'objectives' | 'questions' | 'duration'

export interface AceCourse {
  track: string | null
  ceu_value: number | string
  duration_seconds: number | null
  instructor_name: string | null
  learning_objectives: string | null
}

export function maxCreditsForMinutes(minutes: number): number {
  return Math.floor(minutes / 25) * 0.5
}

export function aceProblems(course: AceCourse, questionCount: number): AceProblem[] {
  const credits = Number(course.ceu_value)
  if (course.track === 'STUDENT' || !(credits > 0)) return []
  const problems: AceProblem[] = []
  if (!Number.isInteger(credits * 2)) problems.push('increment')
  if (!course.instructor_name?.trim()) problems.push('instructor')
  if (!(course.learning_objectives ?? '').split('\n').some((l) => l.replace(/^\s*[-•*\d.)]+\s*/, '').trim())) {
    problems.push('objectives')
  }
  if (questionCount < Math.ceil(credits * 3)) problems.push('questions')
  const minutes = (course.duration_seconds ?? 0) / 60
  if (!minutes || credits > maxCreditsForMinutes(minutes)) problems.push('duration')
  return problems
}
