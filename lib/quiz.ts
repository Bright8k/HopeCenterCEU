import type { Database } from '@/types/database';

type Question = Database['public']['Tables']['questions']['Row'];

export type QuizScore = {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
};

/**
 * Pure scoring function: counts correct answers, calculates percentage, checks pass threshold.
 * Unanswered questions are treated as wrong.
 */
export function scoreQuiz(
  questions: Question[],
  answers: Record<string, number>,
  passScore: number,
): QuizScore {
  const total = questions.length;
  if (total === 0) return { score: 0, passed: false, correct: 0, total: 0 };
  const correct = questions.filter((q) => answers[q.id] === q.answer).length;
  const score = Math.round((correct / total) * 100);
  return { score, passed: score >= passScore, correct, total };
}
