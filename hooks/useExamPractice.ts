import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface PracticeQuestion {
  id: string;
  stem: string;
  options: Record<string, string>;
  domain: string | null;
}

/** Revealed by the server only after the set is submitted. */
export interface PracticeReview {
  isCorrect: boolean;
  answer: number;
}

export interface PracticeResult {
  correct: number;
  total: number;
  score: number;
  review: Record<string, PracticeReview>;
}

export function useExamPractice(domain: string) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (signal?: { active: boolean }) => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchErr } = await supabase
      .from('questions')
      .select('id, stem, options, domain')
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
    if (!questions.length || !user || !hasSupabaseEnv) return;

    setSubmitting(true);
    setSubmitError(null);

    // Graded server-side; answers are revealed only in the response
    const { data, error: submitErr } = await supabase.rpc('submit_practice', { p_answers: answers });

    if (submitErr || !data) {
      setSubmitError('Your answers could not be submitted. Check your connection and try again.');
      setSubmitting(false);
      return;
    }

    const review: Record<string, PracticeReview> = {};
    for (const row of data) review[row.question_id] = { isCorrect: row.is_correct, answer: row.answer };

    const total = questions.length;
    const correct = data.filter((r) => r.is_correct).length;
    setResult({
      correct,
      total,
      score: total > 0 ? Math.round((correct / total) * 100) : 0,
      review,
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
    submitError,
    answeredCount,
    allAnswered,
    setAnswer,
    submit,
    reset,
  };
}
