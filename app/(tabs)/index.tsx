import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCEUProgress } from '@/hooks/useCEUProgress';
import { useCourses } from '@/hooks/useCourses';
import { useStreak } from '@/hooks/useStreak';
import { usePreferences } from '@/context/PreferencesContext';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { ROLE_CEU_REQUIREMENTS, ROLE_LABELS } from '@/constants/roles';
import { hasSupabaseEnv } from '@/lib/supabase';
import { Typography, Shadow, getWebTransitionStyle, withAlpha } from '@/constants/theme';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { user, role } = useAuth();
  const { progress, loading } = useCEUProgress();
  const { displayCourses } = useCourses(role);
  const { data: streak } = useStreak();
  const { colors, textScale, preferences } = usePreferences();
  const styles = createStyles(colors, textScale);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';
  const roleRequirement = role ? ROLE_CEU_REQUIREMENTS[role] : null;
  const completedCourses = progress?.completedCourses ?? 0;
  const earnedCeus = progress?.earned ?? 0;
  const requiredCeus = roleRequirement?.total ?? 0;
  const percentage = progress?.percentage ?? 0;
  const isStudent = role === 'STUDENT';
  const streakDays = streak?.currentStreak ?? 0;
  const hasStreak = streakDays > 0;

  const nextSteps = isStudent
    ? [
        {
          title: 'Continue exam prep',
          description: 'Review practice domains and build your board-style pacing.',
          icon: 'school-outline' as const,
          route: '/(tabs)/exam',
        },
        {
          title: 'Browse study sets',
          description: 'Open the library and find the next mock quiz or review set.',
          icon: 'book-outline' as const,
          route: '/(tabs)/courses',
        },
      ]
    : [
        {
          title: 'Open CEU Library',
          description: 'Find ethics, supervision, and skills-based CEUs aligned to your role.',
          icon: 'library-outline' as const,
          route: '/(tabs)/courses',
        },
        {
          title: 'Review certificates',
          description: 'Keep your completions and proof of progress organized.',
          icon: 'ribbon-outline' as const,
          route: '/(tabs)/profile',
        },
      ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Dashboard"
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroMeta}>
          {role && <Badge label={ROLE_LABELS[role]} variant="primary" size="sm" />}
          {hasStreak && (
            <View style={styles.streakPill}>
              <Text style={styles.streakPillText}>🔥 {streakDays}</Text>
            </View>
          )}
        </View>
        <Text style={styles.heroGreeting} accessibilityRole="text">
          {getGreeting()},
        </Text>
        <Text style={styles.heroName} accessibilityRole="header">
          {firstName}
        </Text>
        <Text style={styles.heroSub}>
          {isStudent
            ? 'Keep building momentum toward your exam.'
            : role && roleRequirement
            ? `${requiredCeus} CEUs every ${roleRequirement.cycleYears} years. You're on track.`
            : 'Track your progress and continue your journey.'}
        </Text>
      </View>

      {/* ── Preview mode notice ── */}
      {!hasSupabaseEnv && (
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Preview mode</Text>
          <Text style={styles.noticeText}>
            Supabase is not configured — this is a layout preview while we continue building.
          </Text>
        </Card>
      )}

      {/* ── Progress card ── */}
      <Card variant="elevated" style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.progressLeft}>
            <Text style={styles.progressEyebrow}>
              {isStudent ? 'EXAM READINESS' : 'CEU PROGRESS'}
            </Text>
            {isStudent ? (
              <Text style={styles.progressTitle}>Stay consistent this week</Text>
            ) : (
              <Text style={styles.progressPct}>
                {loading ? '--' : `${Math.round(percentage)}%`}
              </Text>
            )}
            {!isStudent && (
              <Text style={styles.progressSub}>
                {earnedCeus.toFixed(1)} of {requiredCeus} CEUs earned
              </Text>
            )}
          </View>
          {!isStudent && (
            <View
              style={[styles.progressBadge, { borderColor: withAlpha(colors.primary, '30') }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Text style={[styles.progressBadgeValue, { color: colors.primary }]}>
                {earnedCeus.toFixed(0)}
              </Text>
              <Text style={[styles.progressBadgeSub, { color: colors.textMuted }]}>
                earned
              </Text>
            </View>
          )}
        </View>

        {isStudent ? (
          <Text style={styles.progressText}>
            Student Analysts don't have a CEU requirement here — the dashboard centers your study rhythm and next actions instead.
          </Text>
        ) : (
          <>
            <ProgressBar value={earnedCeus} max={requiredCeus} color={colors.primary} height={8} />
            <Text style={styles.progressText}>
              {loading
                ? 'Refreshing your CEU totals…'
                : completedCourses > 0
                ? `${completedCourses} course${completedCourses === 1 ? '' : 's'} completed this cycle.`
                : 'Complete your first course to start building renewal momentum.'}
            </Text>
          </>
        )}
      </Card>

      {/* ── Metrics row ── */}
      <View style={styles.metricsRow}>
        <MetricCard
          label={isStudent ? 'Study sets' : 'Completed'}
          value={loading ? '--' : String(completedCourses)}
          accent={colors.primary}
          styles={styles}
        />
        <MetricCard
          label={isStudent ? 'Goal' : 'CEUs'}
          value={isStudent ? 'Weekly' : loading ? '--' : earnedCeus.toFixed(1)}
          accent={colors.accent}
          styles={styles}
        />
        <MetricCard
          label="Day streak"
          value={hasStreak ? String(streakDays) : '—'}
          accent={colors.success}
          styles={styles}
        />
      </View>

      {/* ── Streak bar ── */}
      <Pressable
        onPress={() => router.push('/(tabs)/leaderboard')}
        accessibilityRole="button"
        accessibilityLabel={`${hasStreak ? `${streakDays}-day streak` : 'Start your streak'}. Tap to view the leaderboard.`}
        style={({ pressed }) => [styles.streakCard, pressed && { opacity: 0.88 }]}
      >
        <View style={styles.streakLeft}>
          <Text style={styles.streakEmoji}>{hasStreak ? '🔥' : '⚡'}</Text>
          <View>
            <Text style={styles.streakTitle}>
              {hasStreak ? `${streakDays}-day streak` : 'Start your streak'}
            </Text>
            <Text style={styles.streakSub}>
              {hasStreak
                ? `Best: ${streak!.longestStreak} days · Pass a course to keep it going`
                : 'Pass a course today to begin your streak'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />
      </Pressable>

      {/* ── Next steps ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Next steps</Text>
        <Text style={styles.sectionHint}>
          {isStudent ? 'Keep the pressure low and steady.' : 'Small wins add up quickly.'}
        </Text>
      </View>

      {nextSteps.map((step) => (
        <InteractivePressable
          key={step.title}
          onPress={() => router.push(step.route)}
          style={styles.actionPressable}
          hoverStyle={!preferences.reducedMotion ? styles.liftHover : undefined}
          accessibilityLabel={step.title}
          accessibilityHint={step.description}
        >
          {({ hovered }) => (
            <Card
              variant="elevated"
              style={[styles.actionCard, hovered && styles.actionCardActive]}
            >
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: withAlpha(colors.primary, hovered ? '1A' : '12') },
                ]}
              >
                <Ionicons
                  name={step.icon}
                  size={22}
                  color={hovered ? colors.primaryLight : colors.primary}
                />
              </View>
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, hovered && styles.actionTitleActive]}>
                  {step.title}
                </Text>
                <Text style={styles.actionDesc}>{step.description}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={hovered ? colors.primary : colors.textMuted}
              />
            </Card>
          )}
        </InteractivePressable>
      ))}

      {/* ── Recommended courses ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {isStudent ? 'Suggested study sets' : 'Recommended courses'}
        </Text>
        <Text style={styles.sectionHint}>Fresh from your current library.</Text>
      </View>

      {displayCourses.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyInner}>
            <View style={[styles.emptyIconWrap, { backgroundColor: withAlpha(colors.primary, '10') }]}>
              <Ionicons name="library-outline" size={22} color={colors.textMuted} />
            </View>
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>No courses available yet</Text>
              <Text style={styles.emptyText}>Check back soon — new courses are added regularly.</Text>
            </View>
          </View>
        </Card>
      ) : (
        displayCourses.slice(0, 2).map((course) => (
          <InteractivePressable
            key={course.id}
            onPress={() => router.push(`/course/${course.id}`)}
            style={styles.actionPressable}
            hoverStyle={!preferences.reducedMotion ? styles.liftHover : undefined}
            accessibilityLabel={course.title}
            accessibilityHint="Opens the course"
          >
            {({ hovered }) => (
              <Card
                variant="elevated"
                style={[styles.actionCard, hovered && styles.actionCardActive]}
              >
                <View
                  style={[
                    styles.actionIconWrap,
                    { backgroundColor: withAlpha(colors.primary, hovered ? '1A' : '12') },
                  ]}
                >
                  <Ionicons
                    name={isStudent ? 'school-outline' : 'play-circle-outline'}
                    size={22}
                    color={hovered ? colors.primaryLight : colors.primary}
                  />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={[styles.actionTitle, hovered && styles.actionTitleActive]}>
                    {course.title}
                  </Text>
                  <Text style={styles.actionDesc}>
                    {course.description ?? 'Open the library to view full course details.'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={hovered ? colors.primary : colors.textMuted}
                />
              </Card>
            )}
          </InteractivePressable>
        ))
      )}

      {/* ── Footer card ── */}
      <Card style={styles.footerCard}>
        <Text style={styles.footerTitle}>The Hope Center rhythm</Text>
        <Text style={styles.footerText}>
          The goal is steady progress, not cramming. A short session today keeps your learning plan lighter later.
        </Text>
        <View style={styles.footerTags}>
          <Badge label="Family-centered" variant="muted" />
          <Badge label="Evidence-based" variant="primary" />
          <Badge label="Florida ABA" variant="accent" />
        </View>
      </Card>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  accent,
  styles,
}: {
  label: string;
  value: string;
  accent: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View
      style={styles.metricCard}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.metricBar, { backgroundColor: accent }]} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },

    // ── Hero (floating, no card) ──
    hero: {
      paddingTop: 8,
      paddingBottom: 26,
    },
    heroMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    streakPill: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 3,
      backgroundColor: withAlpha(colors.warning, '18'),
    },
    streakPillText: {
      fontSize: 12 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.warning,
      letterSpacing: 0.2,
    },
    heroGreeting: {
      fontSize: 15 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    heroName: {
      fontSize: 40 * textScale,
      lineHeight: 46,
      fontFamily: Typography.heading,
      color: colors.text,
      marginBottom: 10,
    },
    heroSub: {
      fontSize: 14 * textScale,
      lineHeight: 22,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },

    // ── Notice ──
    noticeCard: {
      marginBottom: 14,
    },
    noticeTitle: {
      fontSize: 14 * textScale,
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

    // ── Progress card ──
    progressCard: {
      marginBottom: 14,
    },
    progressHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 12,
    },
    progressLeft: {
      flex: 1,
    },
    progressEyebrow: {
      fontSize: 11 * textScale,
      fontFamily: Typography.bodyBold,
      letterSpacing: 1,
      color: colors.primary,
      marginBottom: 6,
    },
    progressTitle: {
      fontSize: 20 * textScale,
      lineHeight: 26,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
    },
    progressPct: {
      fontSize: 44 * textScale,
      lineHeight: 50,
      fontFamily: Typography.bodyExtraBold,
      color: colors.text,
      marginBottom: 2,
    },
    progressSub: {
      fontSize: 13 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    progressBadge: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressBadgeValue: {
      fontSize: 22 * textScale,
      fontFamily: Typography.bodyExtraBold,
      lineHeight: 26,
    },
    progressBadgeSub: {
      fontSize: 10 * textScale,
      fontFamily: Typography.bodySemiBold,
      letterSpacing: 0.3,
    },
    progressText: {
      marginTop: 10,
      fontSize: 13 * textScale,
      lineHeight: 20,
      color: colors.textMuted,
      fontFamily: Typography.body,
    },

    // ── Metrics row ──
    metricsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    metricCard: {
      flex: 1,
      borderRadius: 16,
      padding: 14,
      backgroundColor: colors.card,
      ...Shadow.sm,
      shadowColor: colors.shadow,
    },
    metricBar: {
      width: 24,
      height: 3,
      borderRadius: 999,
      marginBottom: 10,
    },
    metricValue: {
      fontSize: 22 * textScale,
      fontFamily: Typography.bodyExtraBold,
      color: colors.text,
      marginBottom: 3,
    },
    metricLabel: {
      fontSize: 11 * textScale,
      color: colors.textMuted,
      fontFamily: Typography.bodySemiBold,
      letterSpacing: 0.2,
    },

    // ── Streak bar ──
    streakCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 26,
      backgroundColor: colors.card,
      ...Shadow.sm,
      shadowColor: colors.shadow,
    },
    streakLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    streakEmoji: {
      fontSize: 24,
      lineHeight: 28,
    },
    streakTitle: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 2,
    },
    streakSub: {
      fontSize: 12 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },

    // ── Sections ──
    sectionHeader: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 19 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 2,
    },
    sectionHint: {
      fontSize: 13 * textScale,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },

    // ── Action cards ──
    actionPressable: {
      marginBottom: 10,
    },
    liftHover: {
      transform: [{ translateY: -2 }],
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    actionCardActive: {
      borderColor: withAlpha(colors.primary, '30'),
      shadowColor: colors.primary,
      shadowOpacity: 0.14,
    },
    actionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionCopy: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 3,
      ...(getWebTransitionStyle('color') ?? {}),
    },
    actionTitleActive: {
      color: colors.primary,
    },
    actionDesc: {
      fontSize: 12 * textScale,
      lineHeight: 18,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },

    // ── Empty state ──
    emptyCard: {
      marginBottom: 12,
    },
    emptyInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    emptyIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCopy: {
      flex: 1,
    },
    emptyTitle: {
      fontSize: 14 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 3,
    },
    emptyText: {
      fontSize: 12 * textScale,
      lineHeight: 18,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },

    // ── Footer card ──
    footerCard: {
      marginTop: 8,
    },
    footerTitle: {
      fontSize: 15 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 6,
    },
    footerText: {
      fontSize: 13 * textScale,
      lineHeight: 20,
      color: colors.textSecondary,
      fontFamily: Typography.body,
      marginBottom: 12,
    },
    footerTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
  });
