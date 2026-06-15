import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { updateStreak } from '@/lib/streaks';
import { getCachedCourse, getCachedQuestions } from '@/lib/offline';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/types/database';

type Question = Database['public']['Tables']['questions']['Row'];
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
};

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
  });

  useEffect(() => {
    let active = true;

    async function load() {
      // Try network first when Supabase is configured
      if (hasSupabaseEnv) {
        const [courseRes, questionsRes] = await Promise.all([
          supabase.from('courses').select('*').eq('id', courseId).single(),
          supabase.from('questions').select('*').eq('course_id', courseId).order('domain'),
        ]);

        if (!active) return;

        if (!courseRes.error && !questionsRes.error) {
          setState((s) => ({
            ...s,
            course: courseRes.data as Course | null,
            questions: (questionsRes.data as Question[]) ?? [],
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
          questions: offlineQuestions as unknown as Question[],
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

    setState((s) => ({ ...s, submitting: true }));

    const correct = questions.filter((q) => answers[q.id] === q.answer).length;
    const total = questions.length;
    const score = Math.round((correct / total) * 100);
    const passed = score >= course.pass_score;

    let completionId: string | null = null;

    if (hasSupabaseEnv) {
      // cast required: supabase client lacks Database generic, insert/upsert types resolve to never
      // upsert so retry-after-fail updates the existing row and still returns the id
      const completionsTable = supabase.from('completions') as any;
      const { data: inserted } = await completionsTable
        .upsert(
          { user_id: user.id, course_id: courseId, score, passed },
          { onConflict: 'user_id,course_id', ignoreDuplicates: false },
        )
        .select('id')
        .single();
      completionId = inserted?.id ?? null;

      const attemptsTable = supabase.from('attempts') as any;
      await attemptsTable.insert(
        questions.map((q) => ({
          user_id: user.id,
          question_id: q.id,
          selected: answers[q.id] ?? null,
          is_correct: answers[q.id] === q.answer,
        })),
      );
    }

    setState((s) => ({
      ...s,
      submitting: false,
      result: { score, passed, correct, total },
      certGenerating: passed && !!completionId,
    }));

    // Increment daily streak on any passing attempt
    if (passed && hasSupabaseEnv) {
      void updateStreak(user.id);
    }

    // Generate certificate asynchronously after showing the result screen
    if (passed && completionId && hasSupabaseEnv) {
      supabase.functions
        .invoke('issue-certificate', { body: { completionId } })
        .then(({ data, error }) => {
          if (!error && data?.signedUrl) {
            setState((s) => ({ ...s, certUrl: data.signedUrl, certGenerating: false }));
          } else {
            setState((s) => ({ ...s, certGenerating: false }));
          }
        });
    }
  }, [state, user, courseId]);

  const reset = useCallback(() => {
    setState((s) => ({ ...s, answers: {}, result: null, certUrl: null, certGenerating: false }));
  }, []);

  return { ...state, setAnswer, submit, reset };
}
