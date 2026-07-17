import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { Typography, withAlpha } from '@/constants/theme';

type Course = Database['public']['Tables']['courses']['Row'];

function usePendingCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true });
    setCourses((data as Course[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const removeLocal = (id: string) => setCourses((prev) => prev.filter((c) => c.id !== id));

  return { courses, loading, refetch: load, removeLocal };
}

export default function CourseReview() {
  const { colors, textScale } = usePreferences();
  const { courses, loading, refetch, removeLocal } = usePendingCourses();
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const styles = createStyles(colors, textScale);

  const approve = async (courseId: string) => {
    setActingId(courseId);
    const { error } = await supabase.functions.invoke('review-course', {
      body: { courseId, action: 'approve' },
    });
    setActingId(null);
    if (error) { Alert.alert('Failed', error.message); return; }
    removeLocal(courseId);
  };

  const submitReject = async (courseId: string) => {
    setActingId(courseId);
    const { error } = await supabase.functions.invoke('review-course', {
      body: { courseId, action: 'reject', note: rejectNote.trim() || undefined },
    });
    setActingId(null);
    if (error) { Alert.alert('Failed', error.message); return; }
    removeLocal(courseId);
    setRejectingId(null);
    setRejectNote('');
  };

  const startReject = (course: Course) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Return to draft',
        `Add an optional note for "${course.title}":`,
        (note) => { if (note !== null) void submitReject(course.id); },
        'plain-text',
        '',
      );
    } else {
      setRejectingId(course.id);
      setRejectNote('');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (courses.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="checkmark-done-circle-outline" size={56} color={colors.success} accessibilityElementsHidden />
        <Text style={styles.emptyTitle}>Queue clear</Text>
        <Text style={styles.emptyText}>All submissions have been reviewed. Nice work.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={courses}
      keyExtractor={(c) => c.id}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      refreshing={loading}
      onRefresh={refetch}
      ListHeaderComponent={
        <View style={styles.header}>
          <Ionicons name="hourglass-outline" size={14} color={colors.warning} accessibilityElementsHidden />
          <Text style={styles.headerLabel}>{courses.length} awaiting review</Text>
        </View>
      }
      renderItem={({ item }) => {
        const isActing = actingId === item.id;
        const isRejecting = rejectingId === item.id;
        return (
          <Card style={styles.card}>
            {/* Title + badges */}
            <Pressable
              onPress={() => router.push({ pathname: '/(admin)/course-edit', params: { id: item.id } })}
              accessibilityLabel={`Open ${item.title} in editor`}
              accessibilityHint="Opens the course editor for this submission"
            >
              <Text style={styles.courseTitle}>{item.title}</Text>
            </Pressable>
            <View style={styles.metaRow}>
              <Badge label={item.track ?? 'All'} variant="primary" />
              <Badge label={`${item.ceu_value} CEU`} variant="accent" />
              {item.category && <Badge label={item.category} variant="muted" />}
            </View>

            {/* Description preview */}
            {item.description ? (
              <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
            ) : null}

            {/* Submitted date */}
            <Text style={styles.submittedAt}>
              Submitted {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>

            {/* Reject note input (Android / web fallback) */}
            {isRejecting && (
              <View style={styles.rejectPanel}>
                <Text style={styles.rejectLabel}>Note for content author (optional)</Text>
                <TextInput
                  value={rejectNote}
                  onChangeText={setRejectNote}
                  placeholder="Explain what needs to be revised…"
                  placeholderTextColor={colors.textMuted}
                  style={styles.rejectInput}
                  multiline
                  numberOfLines={3}
                  autoFocus
                  accessibilityLabel="Rejection note"
                />
                <View style={styles.rejectActions}>
                  <Button
                    title={isActing ? 'Returning…' : 'Return to Draft'}
                    onPress={() => void submitReject(item.id)}
                    loading={isActing}
                    variant="outline"
                    style={{ flex: 1 }}
                    textStyle={{ color: colors.error }}
                    accessibilityLabel="Confirm return to draft"
                  />
                  <Button
                    title="Cancel"
                    onPress={() => { setRejectingId(null); setRejectNote(''); }}
                    disabled={isActing}
                    variant="outline"
                    style={{ flex: 1 }}
                    accessibilityLabel="Cancel rejection"
                  />
                </View>
              </View>
            )}

            {/* Action buttons */}
            {!isRejecting && (
              <View style={styles.actions}>
                <Button
                  title={isActing ? 'Publishing…' : 'Approve'}
                  onPress={() => void approve(item.id)}
                  loading={isActing}
                  style={[styles.actionBtn, { flex: 1 }]}
                  accessibilityLabel={`Approve and publish ${item.title}`}
                />
                <Button
                  title="Return"
                  onPress={() => startReject(item)}
                  disabled={isActing}
                  variant="outline"
                  style={[styles.actionBtn, { flex: 1 }]}
                  textStyle={{ color: colors.error }}
                  accessibilityLabel={`Return ${item.title} to draft`}
                />
              </View>
            )}
          </Card>
        );
      }}
    />
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, backgroundColor: colors.background },
    emptyTitle: { fontSize: 18 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    emptyText: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textSecondary, textAlign: 'center' },
    list: { padding: 16, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
    headerLabel: {
      fontSize: 11 * textScale, fontFamily: Typography.bodyBold,
      textTransform: 'uppercase', letterSpacing: 0.6, color: colors.warning,
    },
    card: { marginBottom: 14 },
    courseTitle: { fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.primary, marginBottom: 8 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    desc: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },
    submittedAt: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textMuted, marginBottom: 14 },
    rejectPanel: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 10 },
    rejectLabel: { fontSize: 12 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text },
    rejectInput: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      padding: 10, minHeight: 72,
      fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.text,
      backgroundColor: colors.surface, textAlignVertical: 'top',
    },
    rejectActions: { flexDirection: 'row', gap: 10 },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: {},
  });
