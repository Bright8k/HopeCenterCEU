import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { Typography, withAlpha } from '@/constants/theme';

type Course = Database['public']['Tables']['courses']['Row'];

export default function AdminCourses() {
  const { colors, textScale } = usePreferences();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const styles = createStyles(colors, textScale);

  const fetchCourses = useCallback(async () => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    setCourses((data as Course[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const togglePublish = async (course: Course) => {
    if (!hasSupabaseEnv) return;
    setTogglingId(course.id);
    const { error } = await supabase.functions.invoke('publish-course', {
      body: { courseId: course.id, isPublished: !course.is_published },
    });
    if (error) {
      Alert.alert('Error', 'Could not update publish status. Ensure the Edge Function is deployed.');
    } else {
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, is_published: !c.is_published } : c)),
      );
    }
    setTogglingId(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>
          {loading ? '...' : `${courses.length} course${courses.length !== 1 ? 's' : ''}`}
        </Text>
        <Button
          title="+ New Course"
          onPress={() => router.push('/(admin)/course-edit')}
          style={styles.newBtn}
          accessibilityLabel="Create new course"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : courses.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No courses yet. Tap "+ New Course" to create one.</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchCourses}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Badge label={item.track ?? 'All tracks'} variant="primary" />
                    <Badge label={`${item.ceu_value} CEU`} variant="accent" />
                    <Badge
                      label={item.is_published ? 'Published' : 'Draft'}
                      variant={item.is_published ? 'success' : 'muted'}
                    />
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <InteractivePressable
                    onPress={() =>
                      router.push({
                        pathname: '/(admin)/course-edit',
                        params: { id: item.id },
                      })
                    }
                    accessibilityLabel={`Edit ${item.title}`}
                  >
                    {() => (
                      <View style={[styles.iconBtn, { backgroundColor: withAlpha(colors.primary, '14') }]}>
                        <Ionicons name="pencil-outline" size={17} color={colors.primary} />
                      </View>
                    )}
                  </InteractivePressable>
                  <InteractivePressable
                    onPress={() => togglePublish(item)}
                    accessibilityLabel={item.is_published ? `Unpublish ${item.title}` : `Publish ${item.title}`}
                    disabled={togglingId === item.id}
                  >
                    {() =>
                      togglingId === item.id ? (
                        <ActivityIndicator size="small" color={colors.primary} style={styles.iconBtn} />
                      ) : (
                        <View
                          style={[
                            styles.iconBtn,
                            {
                              backgroundColor: item.is_published
                                ? withAlpha(colors.error, '14')
                                : withAlpha(colors.success, '14'),
                            },
                          ]}
                        >
                          <Ionicons
                            name={item.is_published ? 'eye-off-outline' : 'eye-outline'}
                            size={17}
                            color={item.is_published ? colors.error : colors.success}
                          />
                        </View>
                      )
                    }
                  </InteractivePressable>
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingBottom: 8,
    },
    count: { fontSize: 14 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    newBtn: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 44 },
    loader: { marginTop: 60 },
    list: { padding: 16, paddingTop: 8 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
    emptyText: {
      fontSize: 14 * textScale,
      fontFamily: Typography.body,
      color: colors.textMuted,
      textAlign: 'center',
    },
    card: { marginBottom: 12 },
    cardRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    cardMeta: { flex: 1, gap: 8 },
    cardTitle: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  });
