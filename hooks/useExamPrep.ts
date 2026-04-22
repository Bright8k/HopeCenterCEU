import { useEffect, useMemo, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { PREVIEW_EXAM_DOMAINS, type PreviewDomain } from '@/constants/previewContent';
import { useAuth } from '@/context/AuthContext';

export type ExamDomain = PreviewDomain;

export function useExamPrep() {
  const { user, role } = useAuth();
  const [domains, setDomains] = useState<ExamDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchExamPrep() {
      if (!hasSupabaseEnv || role !== 'STUDENT' || !user) {
        if (active) {
          setDomains([]);
          setErrorMessage(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, domain')
        .eq('track', 'STUDENT');

      if (questionsError) {
        if (active) {
          setDomains([]);
          setErrorMessage(questionsError.message);
          setLoading(false);
        }
        return;
      }

      const { data: attempts, error: attemptsError } = await supabase
        .from('attempts')
        .select('question_id, is_correct')
        .eq('user_id', user.id);

      if (attemptsError) {
        if (active) {
          setDomains([]);
          setErrorMessage(attemptsError.message);
          setLoading(false);
        }
        return;
      }

      const questionRows = ((questions as { id: string; domain: string | null }[] | null) ?? []);
      const attemptRows =
        ((attempts as { question_id: string; is_correct: boolean | null }[] | null) ?? []);

      const attemptsByQuestion = new Map(
        attemptRows.map((attempt) => [attempt.question_id, attempt]),
      );

      const grouped = new Map<string, { questions: number; attempts: number; correct: number }>();

      for (const question of questionRows) {
        const name = question.domain ?? 'General Review';
        const existing = grouped.get(name) ?? { questions: 0, attempts: 0, correct: 0 };
        existing.questions += 1;

        const attempt = attemptsByQuestion.get(question.id);
        if (attempt) {
          existing.attempts += 1;
          if (attempt.is_correct) {
            existing.correct += 1;
          }
        }

        grouped.set(name, existing);
      }

      const domainList: ExamDomain[] = Array.from(grouped.entries()).map(([name, stats]) => ({
        name,
        questions: stats.questions,
        description: 'Live question bank domain ready for focused review and mixed practice.',
        difficulty: stats.questions >= 30 ? 'Core' : 'Focused',
        attempts: stats.attempts,
        accuracy: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : null,
      }));

      if (!active) return;

      setDomains(domainList.sort((a, b) => b.questions - a.questions));
      setLoading(false);
    }

    fetchExamPrep();

    return () => {
      active = false;
    };
  }, [role, user]);

  const displayDomains = useMemo(
    () => (hasSupabaseEnv && domains.length > 0 ? domains : PREVIEW_EXAM_DOMAINS),
    [domains],
  );

  return {
    domains,
    displayDomains,
    loading,
    errorMessage,
    usingPreviewData: !hasSupabaseEnv || domains.length === 0,
  };
}
