import {
  courseComplianceIssues,
  creditUnit,
  formatCredits,
  isHalfIncrement,
  maxCreditsForMinutes,
  minQuestionsForCredits,
  parseObjectives,
} from '@/lib/ace';

const base = {
  track: 'BCBA' as const,
  ceu_value: 1,
  duration_seconds: 3000,
  instructor_name: 'Dr. Example',
  learning_objectives: 'Describe X\nApply Y',
};

describe('ace rules', () => {
  it('maps tracks to credit units', () => {
    expect(creditUnit('RBT')).toBe('PDU');
    expect(creditUnit('BCBA')).toBe('CEU');
    expect(creditUnit(null)).toBe('CEU');
    expect(creditUnit('STUDENT')).toBeNull();
  });

  it('formats credits', () => {
    expect(formatCredits(1, 'BCBA')).toBe('1 CEU');
    expect(formatCredits(1.5, 'RBT')).toBe('1.5 PDUs');
    expect(formatCredits(0, 'RBT')).toBe('No credit');
    expect(formatCredits(2, 'STUDENT')).toBe('No credit');
  });

  it('never rounds credit up', () => {
    expect(maxCreditsForMinutes(24)).toBe(0);
    expect(maxCreditsForMinutes(30)).toBe(0.5);
    expect(maxCreditsForMinutes(50)).toBe(1);
    expect(maxCreditsForMinutes(74)).toBe(1);
    expect(maxCreditsForMinutes(75)).toBe(1.5);
  });

  it('checks half increments and question minimums', () => {
    expect(isHalfIncrement(1.5)).toBe(true);
    expect(isHalfIncrement(1.25)).toBe(false);
    expect(minQuestionsForCredits(1)).toBe(3);
    expect(minQuestionsForCredits(1.5)).toBe(5);
  });

  it('parses objectives with bullets or numbers', () => {
    expect(parseObjectives('- One\n2. Two\n\n• Three')).toEqual(['One', 'Two', 'Three']);
    expect(parseObjectives(null)).toEqual([]);
  });

  it('reports no issues for a compliant course', () => {
    expect(courseComplianceIssues(base, 3)).toEqual([]);
  });

  it('skips courses that award no credit', () => {
    expect(courseComplianceIssues({ ...base, ceu_value: 0, instructor_name: null }, 0)).toEqual([]);
    expect(courseComplianceIssues({ ...base, track: 'STUDENT' }, 0)).toEqual([]);
  });

  it('flags missing details, short quizzes, and over-credited durations', () => {
    const issues = courseComplianceIssues(
      { ...base, instructor_name: ' ', learning_objectives: null, duration_seconds: 1800 },
      2,
    );
    expect(issues).toEqual([
      'No instructor listed',
      'No learning objectives',
      'Needs at least 3 quiz questions (has 2)',
      '30 min supports at most 0.5 credits',
    ]);
  });
});
