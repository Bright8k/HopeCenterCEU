import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Typography, withAlpha } from '@/constants/theme';

const CATEGORIES = [
  { key: 'ui',           label: 'UI / Display' },
  { key: 'courses',      label: 'Courses' },
  { key: 'quiz',         label: 'Quiz / Exam' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'account',      label: 'Account' },
  { key: 'other',        label: 'Other' },
] as const;

type Category = (typeof CATEGORIES)[number]['key'];

export default function ReportBugScreen() {
  const { user } = useAuth();
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing fields', 'Please enter a title and description before submitting.');
      return;
    }
    if (!hasSupabaseEnv || !user) {
      Alert.alert('Preview mode', 'Connect Supabase to submit bug reports.');
      return;
    }
    setSubmitting(true);
    // bug_reports table is new; cast is removed once `supabase gen types` is run post-migration
    const { error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('bug_reports')
      .insert({ user_id: user.id, title: title.trim(), description: description.trim(), category });
    setSubmitting(false);
    if (error) {
      Alert.alert('Submission failed', 'Something went wrong. Please try again shortly.');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={styles.successWrap}>
        <View style={[styles.successIcon, { backgroundColor: withAlpha(colors.success, '16') }]}>
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
        </View>
        <Text style={styles.successTitle}>Report submitted</Text>
        <Text style={styles.successText}>
          Thank you — the team will review your report and follow up if needed.
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Return to profile"
          style={({ pressed }) => [styles.successBtn, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.successBtnText}>Back to profile</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Report a Bug</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Spotted something wrong? Let us know and we'll get it fixed.
        </Text>

        {/* ── Title ── */}
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Brief summary of the issue"
          placeholderTextColor={colors.textMuted}
          maxLength={120}
          returnKeyType="next"
          accessibilityLabel="Bug title"
        />

        {/* ── Category ── */}
        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => setCategory(c.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: category === c.key }}
              accessibilityLabel={c.label}
              style={({ pressed }) => [
                styles.chip,
                category === c.key && { backgroundColor: withAlpha(colors.primary, '16'), borderColor: colors.primary },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={[styles.chipText, category === c.key && { color: colors.primary }]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Description ── */}
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Steps to reproduce, what you expected, what actually happened…"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={2000}
          accessibilityLabel="Bug description"
        />
        <Text style={styles.charCount}>{description.length} / 2000</Text>

        {/* ── Submit ── */}
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Submit bug report"
          accessibilityState={{ disabled: submitting }}
          style={({ pressed }) => [styles.submitBtn, (pressed || submitting) && { opacity: 0.75 }]}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting…' : 'Submit report'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
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
      width: 44, height: 44, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    headerTitle: {
      flex: 1, fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold, color: colors.text, textAlign: 'center',
    },
    headerRight: { width: 44 },
    content: { padding: 20, paddingBottom: 48 },
    intro: {
      fontSize: 14 * textScale, fontFamily: Typography.body,
      color: colors.textSecondary, lineHeight: 21, marginBottom: 24,
    },
    fieldLabel: {
      fontSize: 13 * textScale, fontFamily: Typography.bodyBold,
      color: colors.text, marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15 * textScale, fontFamily: Typography.body,
      color: colors.text, marginBottom: 20,
    },
    textarea: { minHeight: 130, paddingTop: 12 },
    charCount: {
      fontSize: 11 * textScale, fontFamily: Typography.body,
      color: colors.textMuted, textAlign: 'right', marginTop: -14, marginBottom: 24,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipText: {
      fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary,
    },
    submitBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 16, alignItems: 'center', minHeight: 52,
    },
    submitBtnText: {
      fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.white,
    },
    successWrap: {
      flex: 1, backgroundColor: colors.background,
      alignItems: 'center', justifyContent: 'center',
      padding: 32, gap: 14,
    },
    successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontSize: 22 * textScale, fontFamily: Typography.heading, color: colors.text },
    successText: {
      fontSize: 14 * textScale, fontFamily: Typography.body,
      color: colors.textSecondary, textAlign: 'center', lineHeight: 22,
    },
    successBtn: {
      marginTop: 8, paddingHorizontal: 28, paddingVertical: 12,
      borderRadius: 12, backgroundColor: withAlpha(colors.primary, '12'),
    },
    successBtnText: {
      fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.primary,
    },
  });
