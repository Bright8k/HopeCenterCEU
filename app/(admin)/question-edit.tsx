import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { Typography } from '@/constants/theme';

type QuestionRow = Database['public']['Tables']['questions']['Row'];
type Track = 'RBT' | 'BCBA' | 'STUDENT' | null;

const TRACK_OPTIONS: { label: string; value: Track }[] = [
  { label: 'All', value: null },
  { label: 'RBT', value: 'RBT' },
  { label: 'BCBA', value: 'BCBA' },
  { label: 'Student', value: 'STUDENT' },
];

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionEdit() {
  const { id, courseId } = useLocalSearchParams<{ id?: string; courseId?: string }>();
  const isEditing = !!id;
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);

  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [stem, setStem] = useState('');
  const [domain, setDomain] = useState('');
  const [track, setTrack] = useState<Track>(null);
  const [options, setOptions] = useState(['', '', '', '']);
  const [answer, setAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [resolvedCourseId] = useState(courseId ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadQuestion = useCallback(async () => {
    if (!id || !hasSupabaseEnv) {
      setInitialLoading(false);
      return;
    }
    const { data } = await supabase.from('questions').select('*').eq('id', id).single();
    const q = data as QuestionRow | null;
    if (q) {
      setStem(q.stem);
      setDomain(q.domain ?? '');
      setTrack(q.track as Track);
      const opts = q.options as Record<string, string>;
      setOptions([opts['0'] ?? '', opts['1'] ?? '', opts['2'] ?? '', opts['3'] ?? '']);
      setAnswer(q.answer);
      setExplanation(q.explanation ?? '');
    }
    setInitialLoading(false);
  }, [id]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const setOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!stem.trim()) errs.stem = 'Question stem is required';
    if (options.some((o) => !o.trim())) errs.options = 'All four answer choices are required';
    if (!resolvedCourseId && !isEditing) errs.courseId = 'Course is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!hasSupabaseEnv) {
      Alert.alert('Preview mode', 'Supabase is not configured.');
      return;
    }
    setSaving(true);
    const payload = {
      course_id: resolvedCourseId,
      stem: stem.trim(),
      domain: domain.trim() || null,
      track,
      options: { '0': options[0], '1': options[1], '2': options[2], '3': options[3] } as Record<
        string,
        string
      >,
      answer,
      explanation: explanation.trim() || null,
    };
    // cast required: supabase client lacks Database generic, insert/update types resolve to never
    const table = supabase.from('questions') as any;
    const { error } = isEditing
      ? await table.update(payload).eq('id', id)
      : await table.insert(payload);
    setSaving(false);
    if (error) {
      Alert.alert('Save failed', error.message);
    } else {
      router.back();
    }
  };

  if (initialLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Question</Text>
        <Input
          label="Stem *"
          value={stem}
          onChangeText={setStem}
          placeholder="Write the question here..."
          multiline
          numberOfLines={3}
          style={styles.multiline}
          error={errors.stem}
        />
        <Input
          label="Domain (optional)"
          value={domain}
          onChangeText={setDomain}
          placeholder="e.g. Measurement, Behavior Reduction"
        />

        <Text style={styles.sectionLabel}>Answer choices</Text>
        {errors.options ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{errors.options}</Text>
        ) : null}
        {options.map((opt, i) => (
          <Input
            key={i}
            label={`Option ${ANSWER_LABELS[i]}`}
            value={opt}
            onChangeText={(v) => setOption(i, v)}
            placeholder={`Option ${ANSWER_LABELS[i]}`}
          />
        ))}

        <Text style={styles.fieldLabel}>Correct answer</Text>
        <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Correct answer">
          {ANSWER_LABELS.map((label, i) => {
            const selected = answer === i;
            return (
              <Pressable
                key={label}
                onPress={() => setAnswer(i)}
                accessibilityRole="radio"
                accessibilityLabel={`Option ${label}`}
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [
                  styles.answerChip,
                  selected && { backgroundColor: colors.success, borderColor: colors.success },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={[styles.answerChipText, selected && { color: colors.white }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Track</Text>
        <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Track">
          {TRACK_OPTIONS.map(({ label, value }) => {
            const selected = track === value;
            return (
              <Pressable
                key={String(value)}
                onPress={() => setTrack(value)}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [
                  styles.chip,
                  selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Explanation</Text>
        <Input
          label="Explanation (optional)"
          value={explanation}
          onChangeText={setExplanation}
          placeholder="Why is this answer correct?"
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <Button
          title={isEditing ? 'Save Changes' : 'Add Question'}
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
          accessibilityLabel={isEditing ? 'Save question changes' : 'Add question to course'}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 36 },
    sectionLabel: {
      fontSize: 11 * textScale,
      fontFamily: Typography.bodyBold,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.primary,
      marginBottom: 10,
      marginTop: 8,
    },
    fieldLabel: { fontSize: 14, fontFamily: Typography.bodySemiBold, color: colors.text, marginBottom: 8 },
    multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chipText: { fontSize: 14 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text },
    answerChip: {
      width: 48,
      height: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    answerChipText: { fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    errorText: { fontSize: 12, fontFamily: Typography.bodySemiBold, marginBottom: 8 },
    saveBtn: { marginTop: 8 },
  });
