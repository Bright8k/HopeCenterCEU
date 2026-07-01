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
import { Typography, getWebTransitionStyle, withAlpha } from '@/constants/theme';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getRenewalMessage(role: keyof typeof ROLE_CEU_REQUIREMENTS | null) {
  if (!role || role === 'STUDENT') {
    return 'Focus on steady practice and exam readiness this week.';
  }

  const requirement = ROLE_CEU_REQUIREMENTS[role];
  return `${requirement.total} CEUs every ${requirement.cycleYears} years keeps your renewal plan on track.`;
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
          description: 'Keep your completions and proof of progress organized in one place.',
          icon: 'ribbon-outline' as const,
          route: '/(tabs)/profile',
        },
      ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityLabel="Dashboard"
    >
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}
            </Text>
            <Text style={styles.heroTitle}>Welcome back to Hope Center CEU</Text>
            <Text style={styles.heroText}>
              {role ? ROLE_LABELS[role] : 'Choose your track to personalize your dashboard.'}
            </Text>
          </View>
          <View
            style={styles.heroSeal}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.heroSealText}>HC</Text>
          </View>
        </View>

        <View style={styles.heroFooter}>
          <Badge
            label={role ? ROLE_LABELS[role] : 'Learning profile pending'}
            variant="accent"
          />
          <Text style={styles.heroFooterText}>{getRenewalMessage(role ?? null)}</Text>
        </View>
      </View>

      {!hasSupabaseEnv ? (
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Preview mode</Text>
          <Text style={styles.noticeText}>
            Local Supabase values are missing, so this dashboard is showing a layout preview while we keep building.
          </Text>
        </Card>
      ) : null}

      <Card variant="elevated" style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressEyebrow}>
              {isStudent ? 'Exam readiness' : 'CEU progress'}
            </Text>
            <Text style={styles.progressTitle}>
              {isStudent ? 'Stay consistent this week' : `${earnedCeus.toFixed(1)} of ${requiredCeus} CEUs earned`}
            </Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeValue}>
              {loading ? '--' : `${Math.round(percentage)}%`}
            </Text>
          </View>
        </View>

        {isStudent ? (
          <Text style={styles.progressText}>
            Student Analysts do not have a CEU requirement here, so the dashboard centers your study rhythm and next actions.
          </Text>
        ) : (
          <>
            <ProgressBar value={earnedCeus} max={requiredCeus} color={colors.primary} />
            <Text style={styles.progressText}>
              {loading
                ? 'Refreshing your current CEU totals.'
                : completedCourses > 0
                  ? `You have completed ${completedCourses} course${completedCourses === 1 ? '' : 's'} so far in this renewal cycle.`
                  : 'Complete your first course to begin building renewal momentum.'}
            </Text>
          </>
        )}
      </Card>

      <View style={styles.metricsRow}>
        <MetricCard
          label={isStudent ? 'Study Sets' : 'Completed'}
          value={loading ? '--' : String(completedCourses)}
          accent={colors.primary}
          styles={styles}
        />
        <MetricCard
          label={isStudent ? 'Goal' : 'Earned'}
          value={isStudent ? 'Weekly' : loading ? '--' : earnedCeus.toFixed(1)}
          accent={colors.accentDark}
          styles={styles}
        />
        <MetricCard
          label={isStudent ? 'Focus' : 'Cycle'}
          value={isStudent ? 'Exam' : roleRequirement ? `${roleRequirement.cycleYears}yr` : '--'}
          accent={colors.primaryLight}
          styles={styles}
        />
      </View>

      {/* ── Streak card ── */}
      <Pressable
        onPress={() => router.push('/(tabs)/leaderboard')}
        accessibilityRole="button"
        accessibilityLabel={`Your current streak: ${streak?.currentStreak ?? 0} days. Tap to view the leaderboard.`}
        style={({ pressed }) => [styles.streakCard, pressed && { opacity: 0.88 }]}
      >
        <View style={styles.streakLeft}>
          <Text style={styles.streakEmoji}>
            {(streak?.currentStreak ?? 0) > 0 ? '🔥' : '⚡'}
          </Text>
          <View>
            <Text style={styles.streakTitle}>
              {(streak?.currentStreak ?? 0) > 0
                ? `${streak!.currentStreak}-day streak`
                : 'Start your streak'}
            </Text>
            <Text style={styles.streakSub}>
              {(streak?.currentStreak ?? 0) > 0
                ? `Best: ${streak!.longestStreak} days · Pass a course to keep it going`
                : 'Pass a course today to begin your streak'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color={colors.textSecondary} />
      </Pressable>

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
              style={[styles.actionCard, hovered && styles.actionCardHovered]}
            >
              <View style={[styles.actionIconWrap, hovered && styles.actionIconWrapHovered]}>
                <Ionicons name={step.icon} size={22} color={hovered ? colors.primaryLight : colors.primary} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, hovered && styles.actionTitleHovered]}>{step.title}</Text>
                <Text style={styles.actionDescription}>{step.description}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={hovered ? colors.primary : colors.textSecondary}
              />
            </Card>
          )}
        </InteractivePressable>
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {isStudent ? 'Suggested study sets' : 'Recommended next courses'}
        </Text>
        <Text style={styles.sectionHint}>Fresh from your current library.</Text>
      </View>

      {displayCourses.slice(0, 2).map((course) => (
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
              style={[styles.actionCard, hovered && styles.actionCardHovered]}
            >
              <View style={[styles.actionIconWrap, hovered && styles.actionIconWrapHovered]}>
                <Ionicons
                  name={isStudent ? 'school-outline' : 'play-circle-outline'}
                  size={22}
                  color={hovered ? colors.primaryLight : colors.primary}
                />
              </View>
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, hovered && styles.actionTitleHovered]}>{course.title}</Text>
                <Text style={styles.actionDescription}>
                  {course.description ?? 'Open the library to view the full course details.'}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={hovered ? colors.primary : colors.textSecondary}
              />
            </Card>
          )}
        </InteractivePressable>
      ))}

      <Card style={styles.supportCard}>
        <Text style={styles.supportTitle}>Hope Center rhythm</Text>
        <Text style={styles.supportText}>
          The goal is steady progress, not cramming. A short session today keeps your learning plan lighter later.
        </Text>
        <View style={styles.supportTags}>
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
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
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
      paddingBottom: 36,
    },
    hero: {
      borderRadius: 24,
      padding: 20,
      marginBottom: 14,
      backgroundColor: colors.primary,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    heroCopy: {
      flex: 1,
    },
    greeting: {
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.white,
      marginBottom: 10,
    },
    heroTitle: {
      fontSize: 28 * textScale,
      lineHeight: 34,
      fontFamily: Typography.heading,
      color: colors.white,
      marginBottom: 8,
    },
    heroText: {
      fontSize: 14 * textScale,
      lineHeight: 21,
      color: colors.white,
      fontFamily: Typography.body,
    },
    heroSeal: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
    },
    heroSealText: {
      color: colors.primaryDark,
      fontSize: 18,
      fontFamily: Typography.bodyBold,
      letterSpacing: 0.8,
    },
    heroFooter: {
      marginTop: 18,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: withAlpha(colors.white, '33'),
      gap: 10,
    },
    heroFooterText: {
      color: colors.white,
      fontSize: 13 * textScale,
      lineHeight: 20,
      fontFamily: Typography.body,
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
    progressCard: {
      marginBottom: 14,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 14,
    },
    progressEyebrow: {
      fontSize: 12 * textScale,
      fontFamily: Typography.bodyBold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: 6,
    },
    progressTitle: {
      fontSize: 20 * textScale,
      lineHeight: 26,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
    },
    progressBadge: {
      minWidth: 70,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignItems: 'center',
      backgroundColor: withAlpha(colors.accent, '26'),
    },
    progressBadgeValue: {
      fontSize: 20 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.accentDark,
    },
    progressText: {
      marginTop: 12,
      fontSize: 13 * textScale,
      lineHeight: 20,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    streakCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 22,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    streakLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    streakEmoji: {
      fontSize: 26,
      lineHeight: 30,
    },
    streakTitle: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 3,
    },
    streakSub: {
      fontSize: 12 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    metricCard: {
      flex: 1,
      borderRadius: 18,
      padding: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricAccent: {
      width: 26,
      height: 4,
      borderRadius: 999,
      marginBottom: 12,
    },
    metricValue: {
      fontSize: 22 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 12 * textScale,
      color: colors.textSecondary,
      fontFamily: Typography.bodySemiBold,
    },
    sectionHeader: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 2,
    },
    sectionHint: {
      fontSize: 13 * textScale,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    actionPressable: {
      marginBottom: 12,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    actionCardHovered: {
      borderColor: withAlpha(colors.primary, '44'),
      shadowColor: colors.primary,
      shadowOpacity: 0.18,
      shadowRadius: 18,
      backgroundColor: colors.card,
    },
    liftHover: {
      transform: [{ translateY: -2 }],
    },
    actionIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '12'),
    },
    actionIconWrapHovered: {
      backgroundColor: withAlpha(colors.primary, '1A'),
    },
    actionCopy: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 4,
      ...(getWebTransitionStyle('color') ?? {}),
    },
    actionTitleHovered: {
      color: colors.primary,
    },
    actionDescription: {
      fontSize: 13 * textScale,
      lineHeight: 19,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    supportCard: {
      marginTop: 4,
    },
    supportTitle: {
      fontSize: 16 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 8,
    },
    supportText: {
      fontSize: 13 * textScale,
      lineHeight: 20,
      color: colors.textSecondary,
      marginBottom: 12,
      fontFamily: Typography.body,
    },
    supportTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
  });
