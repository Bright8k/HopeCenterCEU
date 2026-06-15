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

type CourseRow = Database['public']['Tables']['courses']['Row'];
type Track = 'RBT' | 'BCBA' | 'STUDENT' | null;

const TRACKS: { label: string; value: Track }[] = [
  { label: 'All', value: null },
  { label: 'RBT', value: 'RBT' },
  { label: 'BCBA', value: 'BCBA' },
  { label: 'Student', value: 'STUDENT' },
];

export default function CourseEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);

  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [track, setTrack] = useState<Track>(null);
  const [ceuValue, setCeuValue] = useState('1.0');
  const [passScore, setPassScore] = useState('80');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadCourse = useCallback(async () => {
    if (!id || !hasSupabaseEnv) {
      setInitialLoading(false);
      return;
    }
    const { data } = await supabase.from('courses').select('*').eq('id', id).single();
    const c = data as CourseRow | null;
    if (c) {
      setTitle(c.title);
      setDescription(c.description ?? '');
      setTrack(c.track as Track);
      setCeuValue(String(c.ceu_value));
      setPassScore(String(c.pass_score));
      setDurationSeconds(c.duration_seconds ? String(c.duration_seconds) : '');
      setVideoUrl(c.video_url ?? '');
      setThumbnailUrl(c.thumbnail_url ?? '');
    }
    setInitialLoading(false);
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    const ceu = parseFloat(ceuValue);
    if (isNaN(ceu) || ceu <= 0) errs.ceuValue = 'Must be a positive number';
    const pass = parseInt(passScore, 10);
    if (isNaN(pass) || pass < 0 || pass > 100) errs.passScore = 'Must be between 0 and 100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete course',
      `"${title}" and all its questions, completions, and attempts will be permanently removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error } = await supabase.functions.invoke('delete-course', {
              body: { courseId: id },
            });
            setDeleting(false);
            if (error) {
              Alert.alert('Delete failed', 'Unable to delete this course. Please try again.');
              return;
            }
            router.back();
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!hasSupabaseEnv) {
      Alert.alert('Preview mode', 'Supabase is not configured.');
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      track,
      ceu_value: parseFloat(ceuValue),
      pass_score: parseInt(passScore, 10),
      duration_seconds: durationSeconds ? parseInt(durationSeconds, 10) : null,
      video_url: videoUrl.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
    };
    // cast required: supabase client lacks Database generic, insert/update types resolve to never
    const table = supabase.from('courses') as any;
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
        <Text style={styles.sectionLabel}>Course details</Text>

        <Input
          label="Title *"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Ethics in ABA Practice"
          error={errors.title}
          autoCapitalize="words"
        />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Brief overview of this course"
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <Text style={styles.fieldLabel}>Track</Text>
        <View style={styles.chipRow}>
          {TRACKS.map(({ label, value }) => (
            <Pressable
              key={String(value)}
              onPress={() => setTrack(value)}
              accessibilityRole="button"
              accessibilityLabel={`Track: ${label}`}
              accessibilityState={{ selected: track === value }}
              style={[
                styles.chip,
                track === value && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.chipText, track === value && { color: colors.white }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Input
          label="CEU Value *"
          value={ceuValue}
          onChangeText={setCeuValue}
          keyboardType="decimal-pad"
          error={errors.ceuValue}
        />
        <Input
          label="Pass Score % (0–100) *"
          value={passScore}
          onChangeText={setPassScore}
          keyboardType="number-pad"
          error={errors.passScore}
        />
        <Input
          label="Duration (seconds)"
          value={durationSeconds}
          onChangeText={setDurationSeconds}
          keyboardType="number-pad"
          placeholder="e.g. 3600 for 1 hour"
        />

        <Text style={styles.sectionLabel}>Media</Text>
        <Input
          label="Video URL"
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="https://..."
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input
          label="Thumbnail URL"
          value={thumbnailUrl}
          onChangeText={setThumbnailUrl}
          placeholder="https://..."
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          title={isEditing ? 'Save Changes' : 'Create Course'}
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
          accessibilityLabel={isEditing ? 'Save course changes' : 'Create new course'}
        />

        {isEditing && (
          <Button
            title={deleting ? 'Deleting…' : 'Delete Course'}
            onPress={handleDelete}
            disabled={deleting || saving}
            variant="outline"
            style={styles.deleteBtn}
            textStyle={{ color: colors.error }}
            accessibilityLabel="Delete this course permanently"
          />
        )}
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
      marginBottom: 12,
      marginTop: 8,
    },
    fieldLabel: { fontSize: 14, fontFamily: Typography.bodySemiBold, color: colors.text, marginBottom: 8 },
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
    multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
    saveBtn: { marginTop: 8 },
    deleteBtn: { marginTop: 10, borderColor: colors.error },
  });

