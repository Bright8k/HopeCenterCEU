import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { Typography, withAlpha } from '@/constants/theme';

type CourseRow = Database['public']['Tables']['courses']['Row'];
type Track = 'RBT' | 'BCBA' | 'STUDENT' | null;
type Category = 'ethics' | 'supervision' | 'general' | null;
type CourseStatus = 'draft' | 'pending_review' | 'published' | 'archived';
type ReviewAction = 'submit' | 'approve' | 'reject' | 'archive' | 'unarchive';

const ACTION_STATUS: Record<ReviewAction, CourseStatus> = {
  submit: 'pending_review',
  approve: 'published',
  reject: 'draft',
  archive: 'archived',
  unarchive: 'draft',
};

const TRACKS: { label: string; value: Track }[] = [
  { label: 'All', value: null },
  { label: 'RBT', value: 'RBT' },
  { label: 'BCBA', value: 'BCBA' },
  { label: 'Student', value: 'STUDENT' },
];

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'General', value: 'general' },
  { label: 'Ethics', value: 'ethics' },
  { label: 'Supervision', value: 'supervision' },
];

export default function CourseEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);

  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [track, setTrack] = useState<Track>(null);
  const [category, setCategory] = useState<Category>(null);
  const [ceuValue, setCeuValue] = useState('1.0');
  const [passScore, setPassScore] = useState('80');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Workflow state
  const [currentStatus, setCurrentStatus] = useState<CourseStatus>('draft');
  const [reviewNote, setReviewNote] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    if (!id || !hasSupabaseEnv) { setInitialLoading(false); return; }
    const { data } = await supabase.from('courses').select('*').eq('id', id).single();
    const c = data as CourseRow | null;
    if (c) {
      setTitle(c.title);
      setDescription(c.description ?? '');
      setTrack(c.track as Track);
      setCategory((c.category as Category) ?? null);
      setCeuValue(String(c.ceu_value));
      setPassScore(String(c.pass_score));
      setDurationMinutes(c.duration_seconds ? String(Math.round(c.duration_seconds / 60)) : '');
      setVideoUrl(c.video_url ?? '');
      setThumbnailUrl(c.thumbnail_url ?? '');
      setCurrentStatus((c.status as CourseStatus) ?? 'draft');
      setReviewNote(c.review_note ?? null);
    }
    setInitialLoading(false);
  }, [id]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

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

  const pickThumbnail = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to pick a thumbnail.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    if (!hasSupabaseEnv) {
      Alert.alert('Preview mode', 'Supabase is not configured — image upload is unavailable.');
      return;
    }
    setUploadingThumb(true);
    try {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const ext = mimeType.split('/')[1] ?? 'jpg';
      const path = `thumbnails/${Date.now()}.${ext}`;
      const byteString = atob(asset.base64);
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
      const { data, error } = await supabase.storage
        .from('course-media')
        .upload(path, bytes, { contentType: mimeType, upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('course-media').getPublicUrl(data.path);
      setThumbnailUrl(urlData.publicUrl);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!hasSupabaseEnv) { Alert.alert('Preview mode', 'Supabase is not configured.'); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      track,
      category,
      ceu_value: parseFloat(ceuValue),
      pass_score: parseInt(passScore, 10),
      duration_seconds: durationMinutes ? Math.round(parseFloat(durationMinutes) * 60) : null,
      video_url: videoUrl.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
    };
    // cast required: supabase client insert/update types resolve to never with this schema config
    const table = supabase.from('courses') as any;
    const { error } = isEditing
      ? await table.update(payload).eq('id', id)
      : await table.insert({ ...payload, status: 'draft' });
    setSaving(false);
    if (error) { Alert.alert('Save failed', error.message); } else { router.back(); }
  };

  const performAction = async (action: ReviewAction, note?: string) => {
    if (!id) { Alert.alert('Save first', 'Save the course before changing its status.'); return; }
    setStatusLoading(true);
    const { error } = await supabase.functions.invoke('review-course', {
      body: { courseId: id, action, note },
    });
    setStatusLoading(false);
    if (error) { Alert.alert('Action failed', error.message); return; }
    setCurrentStatus(ACTION_STATUS[action]);
    setReviewNote(action === 'reject' ? (note ?? null) : null);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete course',
      `"${title}" and all its questions, completions, and attempts will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error } = await supabase.functions.invoke('delete-course', { body: { courseId: id } });
            setDeleting(false);
            if (error) { Alert.alert('Delete failed', 'Unable to delete this course.'); return; }
            router.back();
          },
        },
      ],
    );
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
        {/* ── Status banner ── */}
        {isEditing && <StatusBanner status={currentStatus} reviewNote={reviewNote} styles={styles} colors={colors} />}

        {/* ── Course details ── */}
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
        <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Track">
          {TRACKS.map(({ label, value }) => {
            const sel = track === value;
            return (
              <Pressable
                key={String(value)}
                onPress={() => setTrack(value)}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: sel }}
                style={({ pressed }) => [
                  styles.chip,
                  sel && { backgroundColor: colors.primary, borderColor: colors.primary },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={[styles.chipText, sel && { color: colors.white }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>CEU Category</Text>
        <Text style={styles.fieldHint}>
          Tracks BACB sub-requirements (ethics, supervision) for BCBA renewals.
        </Text>
        <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="CEU category">
          {[{ label: 'None', value: null as Category }, ...CATEGORIES].map(({ label, value }) => {
            const sel = category === value;
            return (
              <Pressable
                key={String(value)}
                onPress={() => setCategory(value)}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: sel }}
                style={({ pressed }) => [
                  styles.chip,
                  sel && { backgroundColor: colors.primary, borderColor: colors.primary },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={[styles.chipText, sel && { color: colors.white }]}>{label}</Text>
              </Pressable>
            );
          })}
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
          label="Duration (minutes)"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="decimal-pad"
          placeholder="e.g. 60"
        />

        {/* ── Media ── */}
        <Text style={styles.sectionLabel}>Media</Text>

        <Text style={styles.fieldLabel}>Thumbnail</Text>
        {thumbnailUrl ? (
          <View style={styles.thumbWrap}>
            <Image source={{ uri: thumbnailUrl }} style={styles.thumbPreview} resizeMode="cover" accessibilityLabel="Course thumbnail preview" />
            <Pressable
              onPress={pickThumbnail}
              disabled={uploadingThumb}
              style={styles.thumbChangeBtn}
              accessibilityLabel="Change thumbnail image"
            >
              {uploadingThumb
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="camera-outline" size={16} color={colors.primary} />}
              <Text style={styles.thumbChangeTxt}>{uploadingThumb ? 'Uploading…' : 'Change image'}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={pickThumbnail}
            disabled={uploadingThumb}
            style={styles.thumbPickBtn}
            accessibilityLabel="Pick thumbnail image from library"
            accessibilityRole="button"
          >
            {uploadingThumb
              ? <ActivityIndicator color={colors.primary} />
              : <Ionicons name="image-outline" size={28} color={colors.textMuted} />}
            <Text style={styles.thumbPickTxt}>{uploadingThumb ? 'Uploading…' : 'Pick thumbnail'}</Text>
            <Text style={styles.thumbPickSub}>16:9 recommended · JPEG or PNG</Text>
          </Pressable>
        )}
        <Input
          label="Thumbnail URL"
          value={thumbnailUrl}
          onChangeText={setThumbnailUrl}
          placeholder="https:// or paste after picking above"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Input
          label="Video URL"
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="https://vimeo.com/ or streaming URL"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.fieldHint}>
          Host videos externally (Vimeo, Cloudflare Stream, S3). Large files are not uploaded directly.
        </Text>

        {/* ── Save ── */}
        <Button
          title={isEditing ? 'Save Changes' : 'Create Course'}
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
          accessibilityLabel={isEditing ? 'Save course changes' : 'Create new course as draft'}
        />

        {/* ── Workflow actions ── */}
        {isEditing && (
          <WorkflowActions
            status={currentStatus}
            loading={statusLoading}
            onAction={performAction}
            styles={styles}
            colors={colors}
          />
        )}

        {/* ── Danger zone ── */}
        {isEditing && (
          <>
            <Text style={styles.sectionLabel}>Danger zone</Text>
            <Button
              title={deleting ? 'Deleting…' : 'Delete Course'}
              onPress={handleDelete}
              disabled={deleting || saving}
              variant="outline"
              style={styles.deleteBtn}
              textStyle={{ color: colors.error }}
              accessibilityLabel="Delete this course permanently"
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBanner({
  status,
  reviewNote,
  styles,
  colors,
}: {
  status: CourseStatus;
  reviewNote: string | null;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof usePreferences>['colors'];
}) {
  const config: Record<CourseStatus, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; bg: string }> = {
    draft:          { icon: 'document-outline',   label: 'Draft — not visible to learners', color: colors.textSecondary, bg: colors.surface },
    pending_review: { icon: 'hourglass-outline',  label: 'Awaiting review',                 color: colors.warning,       bg: withAlpha(colors.warning, '18') },
    published:      { icon: 'checkmark-circle-outline', label: 'Published — live for learners', color: colors.success,  bg: withAlpha(colors.success, '14') },
    archived:       { icon: 'archive-outline',    label: 'Archived — hidden from learners', color: colors.textMuted,     bg: colors.surfaceMuted },
  };
  const { icon, label, color, bg } = config[status] ?? config.draft;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={16} color={color} accessibilityElementsHidden />
      <View style={{ flex: 1 }}>
        <Text style={[styles.bannerLabel, { color }]}>{label}</Text>
        {reviewNote ? (
          <Text style={styles.bannerNote}>Reviewer note: {reviewNote}</Text>
        ) : null}
      </View>
    </View>
  );
}

function WorkflowActions({
  status,
  loading,
  onAction,
  styles,
  colors,
}: {
  status: CourseStatus;
  loading: boolean;
  onAction: (action: ReviewAction, note?: string) => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof usePreferences>['colors'];
}) {
  if (status === 'draft') {
    return (
      <View style={styles.workflowRow}>
        <Button
          title={loading ? 'Submitting…' : 'Submit for Review'}
          onPress={() => onAction('submit')}
          loading={loading}
          variant="outline"
          style={styles.workflowBtn}
          accessibilityLabel="Submit this course for admin review"
        />
      </View>
    );
  }
  if (status === 'pending_review') {
    return (
      <View style={styles.workflowRow}>
        <Button
          title={loading ? 'Working…' : 'Approve & Publish'}
          onPress={() => onAction('approve')}
          loading={loading}
          style={[styles.workflowBtn, { flex: 1 }]}
          accessibilityLabel="Approve and publish this course"
        />
        <Button
          title="Return to Draft"
          onPress={() => onAction('reject')}
          disabled={loading}
          variant="outline"
          style={[styles.workflowBtn, { flex: 1 }]}
          accessibilityLabel="Return course to draft status"
        />
      </View>
    );
  }
  if (status === 'published') {
    return (
      <View style={styles.workflowRow}>
        <Button
          title={loading ? 'Working…' : 'Archive Course'}
          onPress={() => onAction('archive')}
          loading={loading}
          variant="outline"
          style={styles.workflowBtn}
          accessibilityLabel="Archive this course — removes it from the learner library"
        />
      </View>
    );
  }
  if (status === 'archived') {
    return (
      <View style={styles.workflowRow}>
        <Button
          title={loading ? 'Working…' : 'Restore as Draft'}
          onPress={() => onAction('unarchive')}
          loading={loading}
          variant="outline"
          style={styles.workflowBtn}
          accessibilityLabel="Restore archived course to draft"
        />
      </View>
    );
  }
  return null;
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 12,
      borderRadius: 12,
      marginBottom: 18,
    },
    bannerLabel: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, lineHeight: 18 },
    bannerNote: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
    sectionLabel: {
      fontSize: 11 * textScale,
      fontFamily: Typography.bodyBold,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.primary,
      marginBottom: 12,
      marginTop: 8,
    },
    fieldLabel: { fontSize: 14, fontFamily: Typography.bodySemiBold, color: colors.text, marginBottom: 4 },
    fieldHint: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary, marginBottom: 10, lineHeight: 17 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
      paddingHorizontal: 16, paddingVertical: 10,
      borderRadius: 20, borderWidth: 1.5,
      borderColor: colors.border, backgroundColor: colors.card,
      minHeight: 44, alignItems: 'center', justifyContent: 'center',
    },
    chipText: { fontSize: 14 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text },
    multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
    thumbWrap: { marginBottom: 10 },
    thumbPreview: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: colors.surface },
    thumbChangeBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginTop: 8, paddingVertical: 6,
    },
    thumbChangeTxt: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.primary },
    thumbPickBtn: {
      borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border,
      borderRadius: 12, padding: 24,
      alignItems: 'center', gap: 8, marginBottom: 10,
      backgroundColor: colors.surface, minHeight: 44,
    },
    thumbPickTxt: { fontSize: 14 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    thumbPickSub: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textMuted },
    saveBtn: { marginTop: 8 },
    workflowRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 4 },
    workflowBtn: {},
    deleteBtn: { marginTop: 10, borderColor: colors.error },
  });
