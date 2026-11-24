import { courseComplianceCodes, type CourseComplianceInput } from '@/lib/ace';
// The Edge Function copy of the rules (pure TS, no Deno APIs) — must agree with lib/ace.ts
import { aceProblems } from '../../supabase/functions/_shared/ace';

const base: CourseComplianceInput = {
  track: 'BCBA',
  ceu_value: 1,
  duration_seconds: 3000,
  instructor_name: 'Dr. Example',
  learning_objectives: 'Describe X',
};

const cases: [string, CourseComplianceInput, number][] = [
  ['compliant', base, 3],
  ['RBT compliant', { ...base, track: 'RBT' }, 3],
  ['general track', { ...base, track: null }, 3],
  ['student track', { ...base, track: 'STUDENT', instructor_name: null }, 0],
  ['zero credit', { ...base, ceu_value: 0, instructor_name: null }, 0],
  ['quarter credit', { ...base, ceu_value: 1.25 }, 4],
  ['no instructor', { ...base, instructor_name: '  ' }, 3],
  ['bullet-only objectives', { ...base, learning_objectives: '-\n•' }, 3],
  ['numbered objectives', { ...base, learning_objectives: '1. Describe X' }, 3],
  ['short quiz', { ...base, ceu_value: 1.5, duration_seconds: 4500 }, 4],
  ['no duration', { ...base, duration_seconds: null }, 3],
  ['too short', { ...base, ceu_value: 1, duration_seconds: 1800 }, 3],
  ['everything wrong', { ...base, ceu_value: 2.25, duration_seconds: null, instructor_name: null, learning_objectives: null }, 0],
];

describe('ACE rule parity between app and Edge Functions', () => {
  it.each(cases)('%s', (_name, course, questions) => {
    expect(aceProblems(course, questions)).toEqual(courseComplianceCodes(course, questions));
  });

  it('accepts numeric strings from Postgres numeric columns', () => {
    expect(aceProblems({ ...base, ceu_value: '1.0' }, 3)).toEqual([]);
  });
});
