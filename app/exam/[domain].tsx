import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv } from '@/lib/supabase';
import { useExamPractice } from '@/hooks/useExamPractice';
import { Typography, withAlpha } from '@/constants/theme';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function ExamPracticeScreen() {
  const { domain } = useLocalSearchParams<{ domain: string }>();
  const { colors, textScale, preferences } = usePreferences();
  const {
    questions, answers, loading, submitting, result, error,
    answeredCount, allAnswered, setAnswer, submit, reset,
  } = useExamPractice(domain ?? '');
  const [currentIndex, setCurrentIndex] = useState(0);
  const styles = createStyles(colors, textScale);

  // ── No Supabase ──────────────────────────────────────────────────────────
  if (!hasSupabaseEnv) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle} numberOfLines={1}>{domain}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centeredWrap}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Live questions required</Text>
          <Text style={styles.emptyText}>
            Connect to a Supabase project to access domain practice questions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error / empty ────────────────────────────────────────────────────────
  if (error || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle} numberOfLines={1}>{domain}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centeredWrap}>
          <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No questions yet</Text>
          <Text style={styles.emptyText}>
            {error ?? `No practice questions are available for "${domain}" yet.`}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────
  if (result) {
    const pct = result.score;
    const resultColor = pct >= 80 ? colors.success : pct >= 60 ? colors.accentDark : colors.error;

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle} numberOfLines={1}>{domain}</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.resultContent}>
          {/* Score circle */}
          <View style={[styles.scoreCircle, { borderColor: resultColor }]}>
            <Text style={[styles.scoreNumber, { color: resultColor }]}>{pct}%</Text>
            <Text style={styles.scoreLabel}>
              {pct >= 80 ? 'Strong' : pct >= 60 ? 'Progressing' : 'Keep going'}
            </Text>
          </View>

          <Text style={styles.resultTitle}>Practice complete</Text>
          <Text style={styles.resultSubtext}>
            {result.correct} of {result.total} correct
          </Text>

          {/* Per-question review */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewHeading}>Review</Text>
            {questions.map((q, i) => {
              const chosen = answers[q.id];
              const isCorrect = chosen === q.answer;
              const correctLabel = OPTION_LABELS[q.answer];
              const chosenLabel = chosen !== undefined ? OPTION_LABELS[chosen] : '–';
              const optionText = (q.options as Record<string, string>)[String(q.answer)] ?? '';

              return (
                <Card
                  key={q.id}
                  style={[
                    styles.reviewCard,
                    { borderLeftColor: isCorrect ? colors.success : colors.error },
                  ]}
                >
                  <View style={styles.reviewRow}>
                    <Ionicons
                      name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={isCorrect ? colors.success : colors.error}
                    />
                    <Text style={styles.reviewQNum}>Q{i + 1}</Text>
                  </View>
                  <Text style={styles.reviewStem} numberOfLines={3}>{q.stem}</Text>
                  {!isCorrect && (
                    <Text style={styles.reviewAnswer}>
                      Your answer: {chosenLabel ?? '–'} · Correct: {correctLabel}
                    </Text>
                  )}
                  {!isCorrect && (
                    <Text style={styles.reviewCorrectText}>{optionText}</Text>
                  )}
                </Card>
              );
            })}
          </View>

          <View style={styles.resultActions}>
            <Button
              title="Practice again"
              onPress={() => { reset(); setCurrentIndex(0); }}
              variant="outline"
              style={styles.actionBtn}
              accessibilityLabel="Shuffle and practice this domain again"
            />
            <Button
              title="Back to Exam Prep"
              onPress={() => router.back()}
              style={styles.actionBtn}
              accessibilityLabel="Return to exam prep domains"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  const question = questions[currentIndex];
  const selectedAnswer = answers[question.id];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle} numberOfLines={1}>{domain}</Text>
        <Text style={styles.headerCounter}>
          {currentIndex + 1}/{questions.length}
        </Text>
      </View>

      <View
        style={styles.progressBar}
        accessibilityLabel={`Question ${currentIndex + 1} of ${questions.length}`}
        accessibilityRole="progressbar"
      >
        <ProgressBar value={currentIndex + 1} max={questions.length} height={6} />
      </View>

      <ScrollView
        style={styles.quizScroll}
        contentContainerStyle={styles.quizContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.questionWrap}>
          <Text style={styles.questionDomain}>Practice · {domain}</Text>
          <Text style={styles.questionStem}>{question.stem}</Text>
        </View>

        <View style={styles.optionsList}>
          {OPTION_LABELS.map((label, i) => {
            const optionText = (question.options as Record<string, string>)[String(i)] ?? '';
            const isSelected = selectedAnswer === i;

            return (
              <Pressable
                key={i}
                onPress={() => setAnswer(question.id, i)}
                accessibilityRole="button"
                accessibilityLabel={`Option ${label}: ${optionText}`}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, '10') },
                  pressed && !preferences.reducedMotion && styles.optionPressed,
                ]}
              >
                <View style={[styles.optionLetter, isSelected && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.optionLetterText, isSelected && { color: colors.white }]}>
                    {label}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && { color: colors.primary }]}>
                  {optionText}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          accessibilityRole="button"
          accessibilityLabel="Previous question"
          accessibilityState={{ disabled: isFirst }}
          style={[styles.navBtn, isFirst && styles.navBtnDisabled]}
        >
          <Ionicons name="chevron-back" size={22} color={isFirst ? colors.textMuted : colors.text} />
          <Text style={[styles.navBtnText, isFirst && { color: colors.textMuted }]}>Prev</Text>
        </Pressable>

        {isLast ? (
          <Button
            title={allAnswered ? 'Submit' : `${answeredCount}/${questions.length} answered`}
            onPress={submit}
            loading={submitting}
            disabled={!allAnswered}
            style={styles.submitBtn}
            accessibilityLabel={allAnswered ? 'Submit practice session' : 'Answer all questions to submit'}
          />
        ) : (
          <Pressable
            onPress={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            accessibilityRole="button"
            accessibilityLabel="Next question"
            style={styles.navBtn}
          >
            <Text style={styles.navBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );

  function BackButton() {
    return (
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Exit practice and go back"
        style={styles.backBtn}
      >
        <Ionicons name="close" size={22} color={colors.text} />
      </Pressable>
    );
  }
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
    },
    headerCounter: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primary,
    },
    headerRight: { width: 36 },
    progressBar: { marginHorizontal: 16, marginTop: 10, marginBottom: 4 },
    centeredWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 14,
    },
    loadingText: {
      fontSize: 15 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    emptyTitle: {
      fontSize: 18 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    quizScroll: { flex: 1 },
    quizContent: { padding: 16, paddingBottom: 8 },
    questionWrap: { marginBottom: 20 },
    questionDomain: {
      fontSize: 11 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    questionStem: {
      fontSize: 19 * textScale,
      lineHeight: 28,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
    },
    optionsList: { gap: 10 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    optionPressed: { transform: [{ scale: 0.985 }] },
    optionLetter: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      flexShrink: 0,
    },
    optionLetterText: {
      fontSize: 14 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.textSecondary,
    },
    optionText: {
      flex: 1,
      fontSize: 15 * textScale,
      lineHeight: 22,
      fontFamily: Typography.body,
      color: colors.text,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 44,
      minWidth: 80,
    },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.text,
    },
    submitBtn: { flex: 1, marginHorizontal: 8 },
    // Result
    resultContent: {
      padding: 20,
      paddingBottom: 40,
      alignItems: 'center',
    },
    scoreCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 4,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      marginTop: 16,
    },
    scoreNumber: { fontSize: 36 * textScale, fontFamily: Typography.heading },
    scoreLabel: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.textSecondary,
      marginTop: 2,
    },
    resultTitle: {
      fontSize: 24 * textScale,
      fontFamily: Typography.heading,
      color: colors.text,
      marginBottom: 6,
    },
    resultSubtext: {
      fontSize: 14 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      marginBottom: 24,
      textAlign: 'center',
    },
    reviewSection: { width: '100%', gap: 10, marginBottom: 24 },
    reviewHeading: {
      fontSize: 17 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 4,
    },
    reviewCard: {
      borderLeftWidth: 3,
      paddingLeft: 12,
    },
    reviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    reviewQNum: {
      fontSize: 12 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.textSecondary,
    },
    reviewStem: {
      fontSize: 13 * textScale,
      lineHeight: 19,
      fontFamily: Typography.body,
      color: colors.text,
      marginBottom: 6,
    },
    reviewAnswer: {
      fontSize: 12 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.error,
      marginBottom: 4,
    },
    reviewCorrectText: {
      fontSize: 12 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      lineHeight: 17,
    },
    resultActions: { width: '100%', gap: 10 },
    actionBtn: {},
  });
