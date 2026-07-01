import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { usePreferences } from '@/context/PreferencesContext';
import { useAdminCourses, type CourseSort } from '@/hooks/useAdminCourses';
import { Typography, withAlpha } from '@/constants/theme';

const SORT_OPTIONS: { label: string; value: CourseSort }[] = [
  { label: 'Newest', value: 'recent' },
  { label: 'Title', value: 'title' },
  { label: 'CEU', value: 'ceu' },
];

export default function AdminCourses() {
  const { colors, textScale } = usePreferences();
  const { courses, loading, refetch, togglePublish } = useAdminCourses();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CourseSort>('recent');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const styles = createStyles(colors, textScale);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? courses.filter((c) => c.title.toLowerCase().includes(q))
      : [...courses];

    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'ceu') list.sort((a, b) => b.ceu_value - a.ceu_value);
    // 'recent' is already ordered by created_at desc from the hook

    return list;
  }, [courses, query, sort]);

  async function handleToggle(course: Parameters<typeof togglePublish>[0]) {
    setTogglingId(course.id);
    const { error } = await togglePublish(course);
    setTogglingId(null);
    if (error) Alert.alert('Could not update', 'Unable to change publish status.');
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search courses…"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            autoCapitalize="none"
            accessibilityLabel="Search courses"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        <Button
          title="+ New"
          onPress={() => router.push('/(admin)/course-edit')}
          style={styles.newBtn}
          accessibilityLabel="Create new course"
        />
      </View>

      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => {
          const active = sort === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setSort(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`Sort by ${opt.label}`}
              style={({ pressed }) => [
                styles.sortChip,
                active && styles.sortChipActive,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
        <Text style={styles.countLabel}>
          {loading ? '…' : `${filtered.length} / ${courses.length}`}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {query ? 'No matches' : 'No courses yet'}
          </Text>
          <Text style={styles.emptyText}>
            {query
              ? `No courses match "${query}".`
              : 'Tap "+ New" to create your first course.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.badgeRow}>
                    <Badge label={item.track ?? 'All'} variant="primary" />
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
                      router.push({ pathname: '/(admin)/course-edit', params: { id: item.id } })
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
                    onPress={() => handleToggle(item)}
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
    toolbar: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 16, paddingVertical: 12,
    },
    searchWrap: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      paddingHorizontal: 12, paddingVertical: 9,
      backgroundColor: colors.surface,
    },
    searchInput: {
      flex: 1, fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.text,
    },
    newBtn: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 44 },
    sortRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 16, paddingBottom: 10, flexWrap: 'wrap',
    },
    sortChip: {
      borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
      minHeight: 32, alignItems: 'center', justifyContent: 'center',
    },
    sortChipActive: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, '14') },
    sortChipText: { fontSize: 12 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    sortChipTextActive: { color: colors.primary },
    countLabel: { marginLeft: 'auto' as any, fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    loader: { marginTop: 60 },
    list: { padding: 16, paddingTop: 4 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
    emptyTitle: { fontSize: 17 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    emptyText: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textMuted, textAlign: 'center' },
    card: { marginBottom: 10 },
    cardRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    cardMeta: { flex: 1, gap: 8 },
    cardTitle: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  });
