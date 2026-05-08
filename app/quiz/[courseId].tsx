import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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
import { useQuiz } from '@/hooks/useQuiz';
import { Typography, withAlpha } from '@/constants/theme';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { colors, textScale, preferences } = usePreferences();
  const {
    questions, course, answers, loading, submitting, result,
    certUrl, certGenerating, error, setAnswer, submit, reset,
  } = useQuiz(courseId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const styles = createStyles(colors, textScale);

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No questions available</Text>
          <Text style={styles.emptyText}>
            {error ?? 'This course has no questions yet. Check back soon.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Result ───────────────────────────────────────────────────────────────
  if (result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {course?.title ?? 'Quiz'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.resultContent}>
          <View
            style={[
              styles.scoreCircle,
              { borderColor: result.passed ? colors.success : colors.error },
            ]}
          >
            <Text
              style={[styles.scoreNumber, { color: result.passed ? colors.success : colors.error }]}
            >
              {result.score}%
            </Text>
            <Text style={styles.scoreLabel}>{result.passed ? 'Passed' : 'Not passed'}</Text>
          </View>

          <Text style={styles.resultTitle}>
            {result.passed ? 'Well done!' : 'Keep practicing'}
          </Text>
          <Text style={styles.resultSubtext}>
            {result.correct} of {result.total} correct
            {result.passed && course
              ? ` · ${course.ceu_value} CEU${course.ceu_value !== 1 ? 's' : ''} earned`
              : ''}
          </Text>

          {result.passed && (
            <Card variant="elevated" style={styles.earnedCard}>
              <View style={styles.earnedRow}>
                <View style={[styles.earnedIcon, { backgroundColor: withAlpha(colors.success, '20') }]}>
                  <Ionicons name="ribbon-outline" size={22} color={colors.success} />
                </View>
                <View style={styles.earnedCopy}>
                  <Text style={styles.earnedTitle}>
                    {course?.ceu_value} CEU{(course?.ceu_value ?? 1) !== 1 ? 's' : ''} earned
                  </Text>
                  <Text style={styles.earnedText}>Recorded in your profile and renewal tracker.</Text>
                </View>
              </View>

              <View style={styles.certSection}>
                {certGenerating ? (
                  <View style={styles.certGenerating}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.certGeneratingText}>Generating your certificate...</Text>
                  </View>
                ) : certUrl ? (
                  <Pressable
                    onPress={() => Linking.openURL(certUrl)}
                    accessibilityRole="button"
                    accessibilityLabel="Download certificate PDF"
                    style={({ pressed }) => [styles.certBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="download-outline" size={18} color={colors.white} />
                    <Text style={styles.certBtnText}>Download Certificate</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.certUnavailableText}>
                    Certificate will be available in your Profile tab shortly.
                  </Text>
                )}
              </View>
            </Card>
          )}

          {!result.passed && course && (
            <Card style={styles.retryCard}>
              <Text style={styles.retryInfo}>
                Pass score for this course is {course.pass_score}%. You scored {result.score}%.
              </Text>
            </Card>
          )}

          <View style={styles.resultActions}>
            {!result.passed && (
              <Button
                title="Try Again"
                onPress={reset}
                variant="outline"
                style={styles.actionBtn}
                accessibilityLabel="Retry the quiz"
              />
            )}
            <Button
              title="Back to Library"
              onPress={() => router.back()}
              style={styles.actionBtn}
              accessibilityLabel="Return to course library"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Quiz ─────────────────────────────────────────────────────────────────
  const question = questions[currentIndex];
  const selectedAnswer = answers[question.id];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course?.title ?? 'Quiz'}
        </Text>
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
          <Text style={styles.questionDomain}>{question.domain ?? 'Question'}</Text>
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
                <View
                  style={[
                    styles.optionLetter,
                    isSelected && { backgroundColor: colors.primary },
                  ]}
                >
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
            accessibilityLabel={allAnswered ? 'Submit quiz' : 'Answer all questions to submit'}
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
        accessibilityLabel="Exit quiz and go back"
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
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 14,
    },
    loadingText: { fontSize: 15 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    emptyTitle: { fontSize: 18 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    emptyText: {
      fontSize: 14 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
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
    resultContent: { padding: 20, paddingBottom: 40, alignItems: 'center' },
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
    earnedCard: { width: '100%', marginBottom: 16 },
    earnedRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    earnedIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    earnedCopy: { flex: 1 },
    earnedTitle: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 4,
    },
    earnedText: {
      fontSize: 13 * textScale,
      lineHeight: 19,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    certSection: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
    certGenerating: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    certGeneratingText: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    certBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    certBtnText: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.white },
    certUnavailableText: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textMuted },
    retryCard: { width: '100%', marginBottom: 20 },
    retryInfo: {
      fontSize: 14 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    resultActions: { width: '100%', gap: 10 },
    actionBtn: {},
  });
