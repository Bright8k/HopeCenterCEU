import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { useCEUProgress } from '@/hooks/useCEUProgress';
import { useCourses } from '@/hooks/useCourses';
import { useStreak } from '@/hooks/useStreak';
import { useLastLesson } from '@/hooks/useLastLesson';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';
import { usePreferences } from '@/context/PreferencesContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ROLE_CEU_REQUIREMENTS, ROLE_LABELS } from '@/constants/roles';
import { hasSupabaseEnv } from '@/lib/supabase';
import { Typography, withAlpha } from '@/constants/theme';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { user, role } = useAuth();
  const { progress, loading } = useCEUProgress();
  const { lastLesson } = useLastLesson();
  const { alerts, dismiss } = useSmartAlerts();
  const { displayCourses } = useCourses(role);
  const { data: streak } = useStreak();
  const { colors, textScale, preferences } = usePreferences();
  const styles = createStyles(colors, textScale);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';
  const roleLabel = role ? ROLE_LABELS[role] : null;
  const roleRequirement = role ? ROLE_CEU_REQUIREMENTS[role] : null;
  const isStudent = role === 'STUDENT';
  const earned = progress?.earned ?? 0;
  const required = roleRequirement?.total ?? 0;
  const completed = progress?.completedCourses ?? 0;
  const streakDays = streak?.currentStreak ?? 0;
  const ceuLeft = Math.max(0, required - earned);

  const fade = (delay: number) =>
    preferences.reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Dashboard"
    >
      {/* ── Hero ── */}
      <Animated.View entering={fade(0)} style={styles.hero}>
        <Text style={styles.eyebrow} numberOfLines={1}>
          {getGreeting()}{roleLabel ? ` · ${roleLabel}` : ''}
        </Text>
        <Text style={styles.heroName} accessibilityRole="header">
          {firstName}
        </Text>
      </Animated.View>

      {!hasSupabaseEnv && (
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Preview mode</Text>
          <Text style={styles.noticeText}>
            Supabase is not configured — this is a layout preview.
          </Text>
        </Card>
      )}

      {/* ── Smart alerts ── */}
      {alerts.length > 0 && (
        <Animated.View entering={fade(30)} style={styles.alertsWrap}>
          {alerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertCard,
                alert.type === 'renewal' ? { borderLeftColor: colors.warning } : { borderLeftColor: colors.primary },
              ]}
            >
              <Ionicons
                name={alert.icon as 'calendar-outline' | 'sparkles-outline'}
                size={18}
                color={alert.type === 'renewal' ? colors.warning : colors.primary}
                accessibilityElementsHidden
                style={styles.alertIcon}
              />
              <View style={styles.alertBody}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertText}>{alert.body}</Text>
                {alert.actionLabel && alert.actionRoute && (
                  <Pressable
                    onPress={() => router.push(alert.actionRoute as never)}
                    accessibilityRole="button"
                    accessibilityLabel={alert.actionLabel}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignSelf: 'flex-start', marginTop: 4 })}
                  >
                    <Text style={[styles.alertAction, alert.type === 'renewal' ? { color: colors.warning } : {}]}>
                      {alert.actionLabel} →
                    </Text>
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={() => dismiss(alert.id)}
                accessibilityRole="button"
                accessibilityLabel="Dismiss alert"
                style={styles.alertDismiss}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} accessibilityElementsHidden />
              </Pressable>
            </View>
          ))}
        </Animated.View>
      )}

      {/* ── Continue last lesson ── */}
      {lastLesson && (
        <Animated.View entering={fade(40)}>
          <Pressable
            onPress={() => router.push(`/course/${lastLesson.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Continue ${lastLesson.title}`}
            accessibilityHint="Resumes this course"
            style={({ pressed }) => [styles.continueBanner, pressed && { opacity: 0.82 }]}
          >
            <View style={[styles.continueIcon, { backgroundColor: withAlpha(colors.primary, '14') }]}>
              <Ionicons name="play-circle-outline" size={26} color={colors.primary} accessibilityElementsHidden />
            </View>
            <View style={styles.continueCopy}>
              <Text style={styles.continueEyebrow}>CONTINUE WHERE YOU LEFT OFF</Text>
              <Text style={styles.continueTitle} numberOfLines={1}>{lastLesson.title}</Text>
              <View style={styles.continueMeta}>
                {lastLesson.track && <Badge label={lastLesson.track} variant="primary" />}
                {lastLesson.ceu_value > 0 && (
                  <Text style={styles.continueCeu}>{lastLesson.ceu_value} CEU{lastLesson.ceu_value !== 1 ? 's' : ''}</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} accessibilityElementsHidden />
          </Pressable>
        </Animated.View>
      )}

      {/* ── Progress card ── */}
      <Animated.View entering={fade(60)}>
        <Card variant="elevated" style={styles.progressCard}>
          <Text style={styles.sectionLabel}>
            {isStudent ? 'STUDY PROGRESS' : 'CEU PROGRESS'}
          </Text>
          {isStudent ? (
            <Text style={styles.progressTitle}>Keep building momentum</Text>
          ) : (
            <>
              <View style={styles.ceuRow}>
                <Text
                  style={styles.ceuBig}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  {loading ? '–' : earned.toFixed(1)}
                </Text>
                <View style={styles.ceuDenomWrap}>
                  <Text style={styles.ceuDenom}>/ {required}</Text>
                  <Text style={styles.ceuUnit}>CEUs earned</Text>
                </View>
              </View>
              <ProgressBar
                value={earned}
                max={required || 1}
                color={colors.primary}
                height={5}
                accessibilityLabel={`${earned.toFixed(1)} of ${required} CEUs earned`}
              />
              <Text style={styles.progressCaption}>
                {loading
                  ? 'Loading…'
                  : completed > 0
                  ? `${completed} course${completed === 1 ? '' : 's'} completed this cycle`
                  : 'Complete your first course to start tracking'}
              </Text>
            </>
          )}
        </Card>
      </Animated.View>

      {/* ── Stats strip ── */}
      {!isStudent && (
        <Animated.View entering={fade(120)} style={styles.statsStrip}>
          <View
            style={styles.statItem}
            accessibilityRole="text"
            accessibilityLabel={`${completed} courses completed`}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {loading ? '–' : String(completed)}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statsDivider} />
          <View
            style={styles.statItem}
            accessibilityRole="text"
            accessibilityLabel={`${streakDays} day streak`}
          >
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {streakDays > 0 ? String(streakDays) : '–'}
            </Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={styles.statsDivider} />
          <View
            style={styles.statItem}
            accessibilityRole="text"
            accessibilityLabel={`${ceuLeft.toFixed(1)} CEUs remaining`}
          >
            <Text style={[styles.statValue, { color: colors.success }]}>
              {loading ? '–' : ceuLeft.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>CEUs left</Text>
          </View>
        </Animated.View>
      )}

      {/* ── Continue learning ── */}
      <Animated.View entering={fade(isStudent ? 120 : 180)}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>CONTINUE LEARNING</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/courses')}
            accessibilityRole="button"
            accessibilityLabel="View all courses"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={styles.sectionLink}>See all</Text>
          </Pressable>
        </View>

        {displayCourses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No courses available yet — check back soon.</Text>
          </Card>
        ) : (
          <Card variant="elevated" style={styles.courseListCard}>
            {displayCourses.slice(0, 3).map((course, index) => (
              <View key={course.id}>
                {index > 0 && <View style={styles.rowDivider} />}
                <Pressable
                  onPress={() => router.push(`/course/${course.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={course.title}
                  accessibilityHint="Opens course"
                  style={({ pressed }) => [styles.courseRow, pressed && styles.courseRowPressed]}
                >
                  <View style={[styles.courseIcon, { backgroundColor: withAlpha(colors.primary, '12') }]}>
                    <Ionicons
                      name={isStudent ? 'school-outline' : 'play-circle-outline'}
                      size={18}
                      color={colors.primary}
                      accessibilityElementsHidden
                    />
                  </View>
                  <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                  {course.ceu_value > 0 && (
                    <View style={styles.ceuChip}>
                      <Text style={styles.ceuChipText}>{course.ceu_value} CEU</Text>
                    </View>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textMuted}
                    accessibilityElementsHidden
                  />
                </Pressable>
              </View>
            ))}
          </Card>
        )}
      </Animated.View>

      {/* ── Study Resources ── */}
      <Animated.View entering={fade(isStudent ? 150 : 210)}>
        <Pressable
          onPress={() => router.push('/resources')}
          accessibilityRole="button"
          accessibilityLabel="Study resources — books, articles, and websites to help you prepare"
          style={({ pressed }) => [styles.resourcesBanner, pressed && { opacity: 0.82 }]}
        >
          <View style={[styles.resourcesIcon, { backgroundColor: withAlpha(colors.accent, '18') }]}>
            <Ionicons name="library-outline" size={22} color={colors.accent} accessibilityElementsHidden />
          </View>
          <View style={styles.resourcesCopy}>
            <Text style={styles.resourcesTitle}>Study Resources</Text>
            <Text style={styles.resourcesDesc}>Books, articles & websites to help you prepare</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} accessibilityElementsHidden />
        </Pressable>
      </Animated.View>

      {/* ── Quick actions ── */}
      <Animated.View entering={fade(isStudent ? 180 : 240)} style={styles.actionsRow}>
        <Pressable
          onPress={() => router.push('/(tabs)/leaderboard')}
          accessibilityRole="button"
          accessibilityLabel="View leaderboard"
          style={({ pressed }) => [styles.actionTile, pressed && styles.actionTilePressed]}
        >
          <Ionicons name="trophy-outline" size={22} color={colors.accent} accessibilityElementsHidden />
          <Text style={styles.actionTileLabel}>Leaderboard</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/history')}
          accessibilityRole="button"
          accessibilityLabel="View certificates"
          style={({ pressed }) => [styles.actionTile, pressed && styles.actionTilePressed]}
        >
          <Ionicons name="ribbon-outline" size={22} color={colors.primary} accessibilityElementsHidden />
          <Text style={styles.actionTileLabel}>Certificates</Text>
        </Pressable>
        {isStudent ? (
          <Pressable
            onPress={() => router.push('/(tabs)/exam')}
            accessibilityRole="button"
            accessibilityLabel="Open exam prep"
            style={({ pressed }) => [styles.actionTile, pressed && styles.actionTilePressed]}
          >
            <Ionicons name="school-outline" size={22} color={colors.success} accessibilityElementsHidden />
            <Text style={styles.actionTileLabel}>Exam Prep</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/(tabs)/courses')}
            accessibilityRole="button"
            accessibilityLabel="Browse course library"
            style={({ pressed }) => [styles.actionTile, pressed && styles.actionTilePressed]}
          >
            <Ionicons name="library-outline" size={22} color={colors.success} accessibilityElementsHidden />
            <Text style={styles.actionTileLabel}>Browse CEUs</Text>
          </Pressable>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 48, gap: 14 },
    hero: { paddingTop: 8, paddingBottom: 4 },
    eyebrow: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textMuted, letterSpacing: 0.3, marginBottom: 6 },
    heroName: { fontSize: 34 * textScale, lineHeight: 40, fontFamily: Typography.bodyExtraBold, color: colors.text },
    noticeCard: {},
    noticeTitle: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginBottom: 4 },
    noticeText: { fontSize: 13 * textScale, lineHeight: 20, color: colors.textSecondary, fontFamily: Typography.body },
    sectionLabel: { fontSize: 11 * textScale, fontFamily: Typography.bodyBold, color: colors.textMuted, letterSpacing: 1, marginBottom: 0 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sectionLink: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.primary },
    progressCard: {},
    progressTitle: { fontSize: 20 * textScale, lineHeight: 26, fontFamily: Typography.headingSemiBold, color: colors.text },
    ceuRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14 },
    ceuBig: { fontSize: 48 * textScale, lineHeight: 52, fontFamily: Typography.bodyExtraBold, color: colors.text },
    ceuDenomWrap: { paddingBottom: 6 },
    ceuDenom: { fontSize: 18 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary, lineHeight: 22 },
    ceuUnit: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textMuted, letterSpacing: 0.2 },
    progressCaption: { marginTop: 10, fontSize: 13 * textScale, lineHeight: 18, color: colors.textMuted, fontFamily: Typography.body },
    statsStrip: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
    statsDivider: { width: 1, backgroundColor: colors.border, marginVertical: 14 },
    statValue: { fontSize: 22 * textScale, fontFamily: Typography.bodyExtraBold, lineHeight: 26 },
    statLabel: { fontSize: 11 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textMuted, letterSpacing: 0.3 },
    courseListCard: { padding: 0, overflow: 'hidden' },
    courseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    courseRowPressed: { backgroundColor: withAlpha(colors.primary, '06') },
    courseIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    courseTitle: { flex: 1, fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    ceuChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: withAlpha(colors.primary, '10') },
    ceuChipText: { fontSize: 11 * textScale, fontFamily: Typography.bodyBold, color: colors.primary },
    rowDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
    emptyCard: {},
    emptyText: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textSecondary, textAlign: 'center' },
    alertsWrap: { gap: 8 },
    alertCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3 },
    alertIcon: { marginTop: 1 },
    alertBody: { flex: 1 },
    alertTitle: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginBottom: 2 },
    alertText: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary, lineHeight: 19 },
    alertAction: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.primary },
    alertDismiss: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    continueBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: withAlpha(colors.primary, '30') },
    continueIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    continueCopy: { flex: 1, gap: 4 },
    continueEyebrow: { fontSize: 10 * textScale, fontFamily: Typography.bodyBold, color: colors.primary, letterSpacing: 0.7, textTransform: 'uppercase' },
    continueTitle: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    continueMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    continueCeu: { fontSize: 12 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    resourcesBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    resourcesIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    resourcesCopy: { flex: 1 },
    resourcesTitle: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginBottom: 2 },
    resourcesDesc: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    actionsRow: { flexDirection: 'row', gap: 10 },
    actionTile: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    actionTilePressed: { opacity: 0.75 },
    actionTileLabel: { fontSize: 11 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary, textAlign: 'center' },
  });
