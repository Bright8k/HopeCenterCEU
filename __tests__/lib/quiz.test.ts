import { scoreQuiz } from '@/lib/quiz';
import type { Database } from '@/types/database';

type Question = Database['public']['Tables']['questions']['Row'];

function q(id: string, answer: number): Question {
  return { id, answer, stem: 'stub', options: {}, course_id: 'c1', domain: null, track: null, explanation: null };
}

describe('scoreQuiz', () => {
  it('scores 100% when every answer is correct', () => {
    const questions = [q('q1', 0), q('q2', 1), q('q3', 2)];
    expect(scoreQuiz(questions, { q1: 0, q2: 1, q3: 2 }, 80)).toEqual({
      score: 100, passed: true, correct: 3, total: 3,
    });
  });

  it('scores 0% when every answer is wrong', () => {
    const questions = [q('q1', 0), q('q2', 1)];
    expect(scoreQuiz(questions, { q1: 1, q2: 0 }, 80)).toEqual({
      score: 0, passed: false, correct: 0, total: 2,
    });
  });

  it('treats unanswered questions as wrong', () => {
    const questions = [q('q1', 0), q('q2', 1)];
    expect(scoreQuiz(questions, {}, 80)).toEqual({
      score: 0, passed: false, correct: 0, total: 2,
    });
  });

  it('passes at exactly the pass_score threshold', () => {
    // 4/5 = 80% — exactly 80 should pass
    const questions = [q('q1', 0), q('q2', 1), q('q3', 0), q('q4', 1), q('q5', 0)];
    const answers = { q1: 0, q2: 1, q3: 0, q4: 1, q5: 0 }; // all correct → 100%
    expect(scoreQuiz(questions, answers, 80).passed).toBe(true);
  });

  it('fails one below the pass_score threshold', () => {
    // 3/5 = 60% — fails at 80 threshold
    const questions = [q('q1', 0), q('q2', 1), q('q3', 0), q('q4', 1), q('q5', 0)];
    const answers = { q1: 0, q2: 1, q3: 0, q4: 9, q5: 9 }; // 3 correct
    const result = scoreQuiz(questions, answers, 80);
    expect(result.score).toBe(60);
    expect(result.passed).toBe(false);
  });

  it('rounds scores to nearest integer', () => {
    // 1/3 = 33.33… → rounds to 33
    const questions = [q('q1', 0), q('q2', 1), q('q3', 2)];
    expect(scoreQuiz(questions, { q1: 0 }, 80).score).toBe(33);
  });

  it('returns zero totals for empty question list', () => {
    expect(scoreQuiz([], {}, 80)).toEqual({
      score: 0, passed: false, correct: 0, total: 0,
    });
  });
});
