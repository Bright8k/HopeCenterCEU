import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { ROLE_LABELS, type UserRole } from '@/constants/roles';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Course = Database['public']['Tables']['courses']['Row'];
type TrackFilter = 'ALL' | UserRole;

const PREVIEW_COURSES: Course[] = [
  {
    id: 'preview-rbt-1',
    title: 'Behavior Skills Training Essentials',
    description: 'A practical walkthrough of instruction, modeling, rehearsal, and feedback for frontline ABA teams.',
    track: 'RBT',
    ceu_value: 1,
    video_url: null,
    thumbnail_url: null,
    duration_seconds: 2700,
    pass_score: 80,
    is_published: true,
    created_at: '2026-04-16T00:00:00Z',
  },
  {
    id: 'preview-bcba-1',
    title: 'Ethics in Supervision Decisions',
    description: 'Case-based review of documentation, scope, and supervisory judgment for practicing BCBAs.',
    track: 'BCBA',
    ceu_value: 2,
    video_url: null,
    thumbnail_url: null,
    duration_seconds: 4200,
    pass_score: 80,
    is_published: true,
    created_at: '2026-04-15T00:00:00Z',
  },
  {
    id: 'preview-student-1',
    title: 'Mock Exam: Measurement and Data Display',
    description: 'Targeted question set designed to mirror board-style prompts and pacing for student analysts.',
    track: 'STUDENT',
    ceu_value: 0,
    video_url: null,
    thumbnail_url: null,
    duration_seconds: 3000,
    pass_score: 80,
    is_published: true,
    created_at: '2026-04-14T00:00:00Z',
  },
];

const TRACK_FILTERS: TrackFilter[] = ['ALL', 'RBT', 'BCBA', 'STUDENT'];

export default function CoursesScreen() {
  const { role } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<TrackFilter>(role ?? 'ALL');

  useEffect(() => {
    setSelectedTrack(role ?? 'ALL');
  }, [role]);

  useEffect(() => {
    fetchCourses();
  }, [role]);

  const filteredCourses = useMemo(() => {
    const source = hasSupabaseEnv ? courses : PREVIEW_COURSES;
    const normalizedQuery = query.trim().toLowerCase();

    return source.filter((course) => {
      const matchesTrack =
        selectedTrack === 'ALL' || course.track === selectedTrack;
      const matchesRole = !role || role === 'STUDENT' || selectedTrack !== 'ALL'
        ? true
        : course.track === role;
      const matchesQuery =
        !normalizedQuery ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.description?.toLowerCase().includes(normalizedQuery);

      return matchesTrack && matchesRole && matchesQuery;
    });
  }, [courses, query, role, selectedTrack]);

  const featuredCourse = filteredCourses[0] ?? null;
  const totalCeus = filteredCourses.reduce((sum, course) => sum + course.ceu_value, 0);

  async function fetchCourses() {
    if (!hasSupabaseEnv) {
      setCourses([]);
      setErrorMessage(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    let request = supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (role) {
      request = request.eq('track', role);
    }

    const { data, error } = await request;

    if (error) {
      setErrorMessage(error.message);
      setCourses([]);
    } else {
      setCourses((data as Course[]) ?? []);
    }

    setLoading(false);
    setRefreshing(false);
  }

  function onRefresh() {
    setRefreshing(true);
    fetchCourses();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your library...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredCourses}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
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
              <StatPill label="Courses" value={String(filteredCourses.length)} />
              <StatPill label={role === 'STUDENT' ? 'Practice Sets' : 'Total CEUs'} value={role === 'STUDENT' ? String(filteredCourses.length) : totalCeus.toFixed(1)} />
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
            <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={role === 'STUDENT' ? 'Search exams, quizzes, domains...' : 'Search CEU topics, ethics, supervision...'}
              placeholderTextColor={Colors.textSecondary}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={TRACK_FILTERS}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => {
              const active = item === selectedTrack;
              return (
                <TouchableOpacity
                  onPress={() => setSelectedTrack(item)}
                  activeOpacity={0.85}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {item === 'ALL' ? 'All tracks' : item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {featuredCourse ? (
            <Card variant="elevated" style={styles.featuredCard}>
              <View style={styles.featuredHeader}>
                <Badge label="Featured" variant="accent" />
                <Text style={styles.featuredDuration}>{formatDuration(featuredCourse.duration_seconds)}</Text>
              </View>
              <Text style={styles.featuredTitle}>{featuredCourse.title}</Text>
              <Text style={styles.featuredDescription}>{featuredCourse.description ?? 'New course available in your learning library.'}</Text>
              <View style={styles.featuredMeta}>
                <Badge label={featuredCourse.track ?? 'General'} variant="primary" />
                <Badge
                  label={role === 'STUDENT' ? 'Board prep' : `${featuredCourse.ceu_value} CEU`}
                  variant={role === 'STUDENT' ? 'muted' : 'success'}
                />
              </View>
            </Card>
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
        <Card variant="elevated" style={[styles.courseCard, index === filteredCourses.length - 1 && styles.lastCard]}>
          <View style={styles.courseTop}>
            <View style={styles.courseHeaderText}>
              <Text style={styles.courseTitle}>{item.title}</Text>
              <Text style={styles.courseDescription} numberOfLines={3}>
                {item.description ?? 'Course description coming soon.'}
              </Text>
            </View>
            <View style={styles.courseIconWrap}>
              <Ionicons
                name={role === 'STUDENT' ? 'school-outline' : 'play-circle-outline'}
                size={24}
                color={Colors.primary}
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
    />
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
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

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
    backgroundColor: Colors.background,
  },
  headerWrap: {
    marginBottom: 8,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    backgroundColor: Colors.primary,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
    backgroundColor: `${Colors.white}22`,
  },
  heroBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroText: {
    color: '#F6E9F6',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
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
    backgroundColor: `${Colors.white}16`,
  },
  statValue: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#F6E9F6',
    fontSize: 12,
  },
  noticeCard: {
    marginBottom: 14,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  retryButton: {
    marginTop: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: Colors.text,
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
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}12`,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
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
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  featuredTitle: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginBottom: 14,
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
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  courseCard: {
    marginBottom: 12,
  },
  lastCard: {
    marginBottom: 0,
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
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  courseDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  courseIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}10`,
  },
  courseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
