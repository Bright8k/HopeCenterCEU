import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { updateStreak } from '@/lib/streaks';
import { getCachedCourse, getCachedQuestions } from '@/lib/offline';
import { useAuth } from '@/context/AuthContext';
import type { Database, LearnerQuestion } from '@/types/database';

type Question = LearnerQuestion;
type Course = Database['public']['Tables']['courses']['Row'];

export type QuizResult = {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
};

type QuizState = {
  questions: Question[];
  course: Course | null;
  answers: Record<string, number>;
  loading: boolean;
  submitting: boolean;
  result: QuizResult | null;
  certUrl: string | null;
  certGenerating: boolean;
  error: string | null;
  submitError: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useQuiz(courseId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<QuizState>({
    questions: [],
    course: null,
    answers: {},
    loading: true,
    submitting: false,
    result: null,
    certUrl: null,
    certGenerating: false,
    error: null,
    submitError: null,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      // Try network first when Supabase is configured
      if (hasSupabaseEnv) {
        const [courseRes, questionsRes] = await Promise.all([
          supabase.from('courses').select('*').eq('id', courseId).single(),
          supabase.from('questions').select('id, course_id, domain, stem, options, track').eq('course_id', courseId),
        ]);

        if (!active) return;

        if (!courseRes.error && !questionsRes.error) {
          setState((s) => ({
            ...s,
            course: courseRes.data as Course | null,
            questions: shuffle((questionsRes.data as Question[]) ?? []),
            loading: false,
          }));
          return;
        }
      }

      // Network unavailable or failed — try offline cache
      const [offlineCourse, offlineQuestions] = await Promise.all([
        getCachedCourse(courseId),
        getCachedQuestions(courseId),
      ]);

      if (!active) return;

      if (offlineCourse && offlineQuestions.length > 0) {
        setState((s) => ({
          ...s,
          // Offline types are a strict subset of the DB row types — cast is safe for quiz use
          course: offlineCourse as unknown as Course,
          questions: shuffle(offlineQuestions as unknown as Question[]),
          loading: false,
        }));
        return;
      }

      setState((s) => ({
        ...s,
        loading: false,
        error: hasSupabaseEnv
          ? 'Unable to load this course. Check your connection and try again.'
          : 'Download this course while online to take the quiz offline.',
      }));
    }

    void load();
    return () => { active = false; };
  }, [courseId]);

  const setAnswer = useCallback((questionId: string, selectedIndex: number) => {
    setState((s) => ({
      ...s,
      answers: { ...s.answers, [questionId]: selectedIndex },
    }));
  }, []);

  const submit = useCallback(async () => {
    const { questions, course, answers } = state;
    if (!user || !course || questions.length === 0) return;

    if (!hasSupabaseEnv) {
      setState((s) => ({ ...s, submitError: 'Quizzes can only be submitted when connected to Hope Center.' }));
      return;
    }

    setState((s) => ({ ...s, submitting: true, submitError: null }));

    // Graded server-side: answer keys never reach the client and completions can't be self-written
    const { data, error } = await supabase.functions.invoke('submit-quiz', {
      body: { courseId, answers },
    });

    if (error || !data || typeof data.score !== 'number') {
      setState((s) => ({
        ...s,
        submitting: false,
        submitError: 'Your quiz could not be submitted. Check your connection and try again — your answers are saved.',
      }));
      return;
    }

    const result: QuizResult = { score: data.score, passed: data.passed, correct: data.correct, total: data.total };
    const completionId: string | null = data.completionId ?? null;

    setState((s) => ({
      ...s,
      submitting: false,
      result,
      certGenerating: result.passed && !!completionId,
    }));

    if (result.passed) void updateStreak(user.id);

    if (result.passed && completionId) {
      const { data: cert, error: certErr } = await supabase.functions.invoke('issue-certificate', {
        body: { completionId },
      });
      setState((s) => ({
        ...s,
        certUrl: !certErr && cert?.signedUrl ? (cert.signedUrl as string) : null,
        certGenerating: false,
      }));
    }
  }, [state, user, courseId]);

  const reset = useCallback(() => {
    setState((s) => ({ ...s, answers: {}, result: null, certUrl: null, certGenerating: false, submitError: null }));
  }, []);

  return { ...state, setAnswer, submit, reset };
}
