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
import { useAdminCourses, type CourseSort, type CourseStatus } from '@/hooks/useAdminCourses';
import { Typography, withAlpha } from '@/constants/theme';

const SORT_OPTIONS: { label: string; value: CourseSort }[] = [
  { label: 'Newest', value: 'recent' },
  { label: 'Title', value: 'title' },
  { label: 'CEU', value: 'ceu' },
];

type StatusFilter = 'all' | CourseStatus;

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Pending', value: 'pending_review' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

const STATUS_BADGE: Record<CourseStatus, { label: string; variant: 'success' | 'muted' | 'primary' | 'accent' }> = {
  draft:          { label: 'Draft',   variant: 'muted' },
  pending_review: { label: 'Pending', variant: 'accent' },
  published:      { label: 'Live',    variant: 'success' },
  archived:       { label: 'Archived', variant: 'muted' },
};

export default function AdminCourses() {
  const { colors, textScale } = usePreferences();
  const { courses, loading, pendingCount, refetch, setStatus, togglePublish } = useAdminCourses();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CourseSort>('recent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const styles = createStyles(colors, textScale);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = courses.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'ceu') list.sort((a, b) => b.ceu_value - a.ceu_value);
    return list;
  }, [courses, query, sort, statusFilter]);

  async function handleToggle(course: Parameters<typeof togglePublish>[0]) {
    setTogglingId(course.id);
    const { error } = await togglePublish(course);
    setTogglingId(null);
    if (error) Alert.alert('Could not update', 'Unable to change publish status.');
  }

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} accessibilityElementsHidden />
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
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" style={styles.clearBtn}>
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

      {/* Status filter tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          const isPending = f.value === 'pending_review' && pendingCount > 0;
          return (
            <Pressable
              key={f.value}
              onPress={() => setStatusFilter(f.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`Filter by ${f.label}`}
              style={({ pressed }) => [
                styles.filterChip,
                active && styles.filterChipActive,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
              {isPending && (
                <View style={styles.pendingBadge} accessibilityLabel={`${pendingCount} pending`}>
                  <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Sort row */}
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
          <Ionicons name="book-outline" size={48} color={colors.textMuted} accessibilityElementsHidden />
          <Text style={styles.emptyTitle}>{query ? 'No matches' : 'No courses'}</Text>
          <Text style={styles.emptyText}>
            {query ? `No courses match "${query}".` : 'Tap "+ New" to create a course.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const badge = STATUS_BADGE[item.status as CourseStatus] ?? STATUS_BADGE.draft;
            return (
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.badgeRow}>
                      <Badge label={item.track ?? 'All'} variant="primary" />
                      <Badge label={`${item.ceu_value} CEU`} variant="accent" />
                      <Badge label={badge.label} variant={badge.variant} />
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <InteractivePressable
                      onPress={() => router.push({ pathname: '/(admin)/course-edit', params: { id: item.id } })}
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
                      accessibilityLabel={item.is_published ? `Archive ${item.title}` : `Publish ${item.title}`}
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
            );
          }}
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
    searchInput: { flex: 1, fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.text },
    clearBtn: { padding: 2 },
    newBtn: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 44 },
    filterRow: {
      flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 6, flexWrap: 'wrap',
    },
    filterChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
      minHeight: 32,
    },
    filterChipActive: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, '14') },
    filterChipText: { fontSize: 12 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    filterChipTextActive: { color: colors.primary },
    pendingBadge: {
      minWidth: 18, height: 18, borderRadius: 9,
      backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 4,
    },
    pendingBadgeText: { fontSize: 10, fontFamily: Typography.bodyBold, color: colors.white },
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
