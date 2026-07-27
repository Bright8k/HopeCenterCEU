import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface PracticeQuestion {
  id: string;
  stem: string;
  options: Record<string, string>;
  answer: number;
  domain: string | null;
}

export interface PracticeResult {
  correct: number;
  total: number;
  score: number;
}

export function useExamPractice(domain: string) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (signal?: { active: boolean }) => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchErr } = await supabase
      .from('questions')
      .select('id, stem, options, answer, domain')
      .eq('track', 'STUDENT')
      .eq('domain', domain)
      .limit(20);

    if (signal && !signal.active) return;

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

    const shuffled = [...((data ?? []) as PracticeQuestion[])].sort(
      () => Math.random() - 0.5,
    );
    setQuestions(shuffled);
    setLoading(false);
  }, [domain]);

  useEffect(() => {
    const signal = { active: true };
    void fetchQuestions(signal);
    return () => { signal.active = false; };
  }, [fetchQuestions]);

  const setAnswer = useCallback((questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }, []);

  const submit = useCallback(async () => {
    if (!questions.length) return;

    setSubmitting(true);

    const total = questions.length;
    const answerRows = questions
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => ({
        question_id: q.id,
        selected: answers[q.id] as number,
        is_correct: answers[q.id] === q.answer,
      }));
    const correct = answerRows.filter((r) => r.is_correct).length;

    if (user && hasSupabaseEnv && answerRows.length > 0) {
      await supabase.from('attempts').insert(
        answerRows.map((r) => ({ ...r, user_id: user.id })),
      );
    }

    setResult({
      correct,
      total,
      score: total > 0 ? Math.round((correct / total) * 100) : 0,
    });
    setSubmitting(false);
  }, [questions, answers, user]);

  const reset = useCallback(() => {
    setAnswers({});
    setResult(null);
    setQuestions((prev) => [...prev].sort(() => Math.random() - 0.5));
  }, []);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  return {
    questions,
    answers,
    loading,
    submitting,
    result,
    error,
    answeredCount,
    allAnswered,
    setAnswer,
    submit,
    reset,
  };
}
