import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { ROLE_LABELS, type UserRole } from '@/constants/roles';
import { hasSupabaseEnv } from '@/lib/supabase';
import { useCourses } from '@/hooks/useCourses';
import { Skeleton } from '@/components/ui/Skeleton';
import { Typography, getWebTransitionStyle, withAlpha } from '@/constants/theme';

type TrackFilter = 'ALL' | UserRole;

const TRACK_FILTERS: TrackFilter[] = ['ALL', 'RBT', 'BCBA', 'STUDENT'];

export default function CoursesScreen() {
  const { role } = useAuth();
  const { colors, textScale, preferences } = usePreferences();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<TrackFilter>(role ?? 'ALL');
  const { displayCourses, loading, errorMessage, refetch } = useCourses(role);
  const styles = createStyles(colors, textScale);

  useEffect(() => {
    setSelectedTrack(role ?? 'ALL');
  }, [role]);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return displayCourses.filter((course) => {
      const matchesTrack = selectedTrack === 'ALL' || course.track === selectedTrack;
      const matchesRole =
        !role || role === 'STUDENT' || selectedTrack !== 'ALL' ? true : course.track === role;
      const matchesQuery =
        !normalizedQuery ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.description?.toLowerCase().includes(normalizedQuery);

      return matchesTrack && matchesRole && matchesQuery;
    });
  }, [displayCourses, query, role, selectedTrack]);

  const featuredCourse = filteredCourses[0] ?? null;
  const totalCeus = filteredCourses.reduce((sum, course) => sum + course.ceu_value, 0);

  async function fetchCourses() {
    await refetch();
    setRefreshing(false);
  }

  function onRefresh() {
    setRefreshing(true);
    void fetchCourses();
  }

  if (loading) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        scrollEnabled={false}
        accessibilityLabel="Loading course library"
      >
        {/* Hero */}
        <View style={[styles.hero, { gap: 10 }]}>
          <Skeleton
            width={104}
            height={26}
            borderRadius={13}
            style={{ backgroundColor: withAlpha(colors.white, '30') }}
          />
          <Skeleton
            width="68%"
            height={32}
            borderRadius={8}
            style={{ backgroundColor: withAlpha(colors.white, '30') }}
          />
          <Skeleton
            height={14}
            borderRadius={6}
            style={{ backgroundColor: withAlpha(colors.white, '25') }}
          />
          <Skeleton
            width="75%"
            height={14}
            borderRadius={6}
            style={{ backgroundColor: withAlpha(colors.white, '25') }}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Skeleton
              width="48%"
              height={54}
              borderRadius={18}
              style={{ backgroundColor: withAlpha(colors.white, '22') }}
            />
            <Skeleton
              width="48%"
              height={54}
              borderRadius={18}
              style={{ backgroundColor: withAlpha(colors.white, '22') }}
            />
          </View>
        </View>
        {/* Search */}
        <Skeleton height={44} borderRadius={12} style={{ marginBottom: 14 }} />
        {/* Filter chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          {[78, 52, 62, 78].map((w, i) => (
            <Skeleton key={i} width={w} height={34} borderRadius={17} />
          ))}
        </View>
        {/* Featured card */}
        <Skeleton height={162} borderRadius={16} style={{ marginBottom: 18 }} />
        {/* Section header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Skeleton width={148} height={18} borderRadius={6} />
          <Skeleton width={26} height={18} borderRadius={6} />
        </View>
        {/* Course card rows */}
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={104} borderRadius={16} style={{ marginBottom: 10 }} />
        ))}
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={filteredCourses}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {role ? ROLE_LABELS[role] : 'All learning tracks'}
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              {role === 'STUDENT' ? 'Exam Prep Library' : 'CEU Library'}
            </Text>
            <Text style={styles.heroText}>
              {hasSupabaseEnv
                ? 'Browse your published course catalog, narrow by track, and keep building momentum.'
                : 'Preview the library layout while local Supabase values are being finalized.'}
            </Text>
            <View style={styles.heroStats}>
              <StatPill label="Courses" value={String(filteredCourses.length)} styles={styles} />
              <StatPill
                label={role === 'STUDENT' ? 'Practice Sets' : 'Total CEUs'}
                value={role === 'STUDENT' ? String(filteredCourses.length) : totalCeus.toFixed(1)}
                styles={styles}
              />
            </View>
          </View>

          {!hasSupabaseEnv ? (
            <Card style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Preview mode</Text>
              <Text style={styles.noticeText}>
                Add Supabase values to `.env` to load live courses. Until then, this screen uses curated preview content.
              </Text>
            </Card>
          ) : null}

          {errorMessage ? (
            <Card style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Unable to load courses</Text>
              <Text style={styles.noticeText}>{errorMessage}</Text>
              <Button title="Try again" onPress={fetchCourses} style={styles.retryButton} />
            </Card>
          ) : null}

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={
                role === 'STUDENT'
                  ? 'Search exams, quizzes, domains...'
                  : 'Search CEU topics, ethics, supervision...'
              }
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel={role === 'STUDENT' ? 'Search study sets' : 'Search CEU courses'}
              accessibilityHint="Filters the list by title or description"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery('')}
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Use ScrollView, not FlatList — nesting FlatList inside ListHeaderComponent causes scroll conflicts */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            accessibilityRole="radiogroup"
            accessibilityLabel="Filter by learning track"
          >
            {TRACK_FILTERS.map((item) => {
              const active = item === selectedTrack;
              return (
                <InteractivePressable
                  key={item}
                  onPress={() => setSelectedTrack(item)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  hoverStyle={!preferences.reducedMotion ? styles.filterChipHover : undefined}
                  accessibilityRole="radio"
                  accessibilityLabel={item === 'ALL' ? 'All tracks' : `${item} track`}
                  accessibilityHint="Filters the course library by learning track"
                  accessibilityState={{ checked: active }}
                >
                  {({ hovered }) => (
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                        hovered && styles.filterChipTextHovered,
                      ]}
                    >
                      {item === 'ALL' ? 'All tracks' : item}
                    </Text>
                  )}
                </InteractivePressable>
              );
            })}
          </ScrollView>

          {featuredCourse ? (
            <InteractivePressable
              onPress={() => router.push(`/course/${featuredCourse.id}`)}
              accessibilityLabel={featuredCourse.title}
              accessibilityHint="Tap to open this course"
            >
              {() => (
                <Card variant="elevated" style={styles.featuredCard}>
                  <View style={styles.featuredHeader}>
                    <Badge label="Featured" variant="accent" />
                    <Text style={styles.featuredDuration}>
                      {formatDuration(featuredCourse.duration_seconds)}
                    </Text>
                  </View>
                  <Text style={styles.featuredTitle}>{featuredCourse.title}</Text>
                  <Text style={styles.featuredDescription}>
                    {featuredCourse.description ?? 'New course available in your learning library.'}
                  </Text>
                  <View style={styles.featuredMeta}>
                    <Badge label={featuredCourse.track ?? 'General'} variant="primary" />
                    <Badge
                      label={role === 'STUDENT' ? 'Board prep' : `${featuredCourse.ceu_value} CEU`}
                      variant={role === 'STUDENT' ? 'muted' : 'success'}
                    />
                  </View>
                </Card>
              )}
            </InteractivePressable>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {role === 'STUDENT' ? 'Practice catalog' : 'Available courses'}
            </Text>
            <Text style={styles.sectionCount}>{filteredCourses.length}</Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>
            Try a different search term or switch tracks to explore more of the library.
          </Text>
        </Card>
      }
      renderItem={({ item, index }) => (
        <InteractivePressable
          onPress={() => router.push(`/course/${item.id}`)}
          style={styles.coursePressable}
          hoverStyle={!preferences.reducedMotion ? styles.hoverLift : undefined}
          accessibilityLabel={item.title}
          accessibilityHint="Tap to open this course"
        >
          {({ hovered }) => (
            <Card
              variant="elevated"
              style={[
                styles.courseCard,
                index === filteredCourses.length - 1 && styles.lastCard,
                hovered && styles.courseCardHovered,
              ]}
            >
              <View style={styles.courseTop}>
                <View style={styles.courseHeaderText}>
                  <Text style={[styles.courseTitle, hovered && styles.courseTitleHovered]}>
                    {item.title}
                  </Text>
                  <Text style={styles.courseDescription} numberOfLines={3}>
                    {item.description ?? 'Course description coming soon.'}
                  </Text>
                </View>
                <View style={[styles.courseIconWrap, hovered && styles.courseIconWrapHovered]}>
                  <Ionicons
                    name={role === 'STUDENT' ? 'school-outline' : 'play-circle-outline'}
                    size={24}
                    color={hovered ? colors.primaryLight : colors.primary}
                  />
                </View>
              </View>

              <View style={styles.courseMeta}>
                <Badge label={item.track ?? 'General'} variant="primary" />
                <Badge label={formatDuration(item.duration_seconds)} variant="muted" />
                <Badge
                  label={role === 'STUDENT' ? `Score ${item.pass_score}%` : `${item.ceu_value} CEU`}
                  variant={role === 'STUDENT' ? 'accent' : 'success'}
                />
              </View>
            </Card>
          )}
        </InteractivePressable>
      )}
    />
  );

}

function StatPill({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDuration(durationSeconds: number | null) {
  if (!durationSeconds) return 'Self-paced';
  const minutes = Math.round(durationSeconds / 60);
  return `${minutes} min`;
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 14,
      fontSize: 14 * textScale,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    content: {
      padding: 16,
      paddingBottom: 36,
      backgroundColor: colors.background,
    },
    headerWrap: {
      marginBottom: 8,
    },
    hero: {
      borderRadius: 24,
      padding: 20,
      marginBottom: 14,
      backgroundColor: colors.primary,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 14,
      backgroundColor: withAlpha(colors.white, '22'),
    },
    heroBadgeText: {
      color: colors.white,
      fontSize: 12 * textScale,
      fontFamily: Typography.bodyBold,
      letterSpacing: 0.4,
    },
    heroTitle: {
      color: colors.white,
      fontSize: 28 * textScale,
      fontFamily: Typography.heading,
      marginBottom: 8,
    },
    heroText: {
      color: colors.white,
      fontSize: 14 * textScale,
      lineHeight: 21,
      marginBottom: 18,
      fontFamily: Typography.body,
    },
    heroStats: {
      flexDirection: 'row',
      gap: 10,
    },
    statPill: {
      flex: 1,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 12,
      backgroundColor: withAlpha(colors.white, '18'),
    },
    statValue: {
      color: colors.white,
      fontSize: 20 * textScale,
      fontFamily: Typography.headingSemiBold,
      marginBottom: 2,
    },
    statLabel: {
      color: colors.white,
      fontSize: 12 * textScale,
      fontFamily: Typography.bodySemiBold,
    },
    noticeCard: {
      marginBottom: 14,
    },
    noticeTitle: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 4,
    },
    noticeText: {
      fontSize: 13 * textScale,
      lineHeight: 20,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    retryButton: {
      marginTop: 12,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 15 * textScale,
      color: colors.text,
      fontFamily: Typography.body,
    },
    filterRow: {
      paddingBottom: 12,
      gap: 10,
    },
    filterChip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    filterChipActive: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, '14'),
    },
    filterChipHover: {
      transform: [{ translateY: -1 }],
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    filterChipText: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary,
      ...(getWebTransitionStyle('color') ?? {}),
    },
    filterChipTextActive: {
      color: colors.primary,
    },
    filterChipTextHovered: {
      color: colors.primary,
    },
    featuredCard: {
      marginBottom: 16,
    },
    featuredHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    featuredDuration: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary,
    },
    featuredTitle: {
      fontSize: 20 * textScale,
      lineHeight: 27,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 8,
    },
    featuredDescription: {
      fontSize: 14 * textScale,
      lineHeight: 21,
      color: colors.textSecondary,
      marginBottom: 14,
      fontFamily: Typography.body,
    },
    featuredMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
    },
    sectionCount: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primary,
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 28,
    },
    emptyTitle: {
      fontSize: 17 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 6,
    },
    emptyText: {
      fontSize: 13 * textScale,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    coursePressable: {
      marginBottom: 12,
    },
    courseCard: {},
    courseCardHovered: {
      borderColor: withAlpha(colors.primary, '44'),
      shadowColor: colors.primary,
      shadowOpacity: 0.18,
      shadowRadius: 18,
      backgroundColor: colors.card,
    },
    lastCard: {
      marginBottom: 0,
    },
    hoverLift: {
      transform: [{ translateY: -2 }],
    },
    courseTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 12,
    },
    courseHeaderText: {
      flex: 1,
    },
    courseTitle: {
      fontSize: 17 * textScale,
      lineHeight: 23,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 6,
      ...(getWebTransitionStyle('color') ?? {}),
    },
    courseTitleHovered: {
      color: colors.primary,
    },
    courseDescription: {
      fontSize: 14 * textScale,
      lineHeight: 20,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    courseIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '12'),
    },
    courseIconWrapHovered: {
      backgroundColor: withAlpha(colors.primary, '1A'),
    },
    courseMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
  });
