import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCEUProgress } from '@/hooks/useCEUProgress';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Colors } from '@/constants/Colors';
import { ROLE_CEU_REQUIREMENTS, ROLE_LABELS } from '@/constants/roles';
import { hasSupabaseEnv } from '@/lib/supabase';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
          <View style={styles.heroSeal}>
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
            <ProgressBar value={earnedCeus} max={requiredCeus} color={Colors.primary} />
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
          accent={Colors.primary}
        />
        <MetricCard
          label={isStudent ? 'Goal' : 'Earned'}
          value={isStudent ? 'Weekly' : loading ? '--' : earnedCeus.toFixed(1)}
          accent={Colors.accentDark}
        />
        <MetricCard
          label={isStudent ? 'Focus' : 'Cycle'}
          value={isStudent ? 'Exam' : roleRequirement ? `${roleRequirement.cycleYears}yr` : '--'}
          accent={Colors.primaryDark}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Next steps</Text>
        <Text style={styles.sectionHint}>
          {isStudent ? 'Keep the pressure low and steady.' : 'Small wins add up quickly.'}
        </Text>
      </View>

      {nextSteps.map((step) => (
        <TouchableOpacity
          key={step.title}
          activeOpacity={0.85}
          onPress={() => router.push(step.route)}
        >
          <Card variant="elevated" style={styles.actionCard}>
            <View style={styles.actionIconWrap}>
              <Ionicons name={step.icon} size={22} color={Colors.primary} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>{step.title}</Text>
              <Text style={styles.actionDescription}>{step.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Card>
        </TouchableOpacity>
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
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    backgroundColor: Colors.primary,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#F9EAF9',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 8,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#F4E3F4',
  },
  heroSeal: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.accent}CC`,
  },
  heroSealText: {
    color: Colors.primaryDark,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroFooter: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: `${Colors.white}22`,
    gap: 10,
  },
  heroFooterText: {
    color: '#F9EAF9',
    fontSize: 13,
    lineHeight: 20,
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.primary,
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  progressBadge: {
    minWidth: 70,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: `${Colors.accent}22`,
  },
  progressBadgeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.accentDark,
  },
  progressText: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricAccent: {
    width: 26,
    height: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionCard: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}10`,
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  supportCard: {
    marginTop: 4,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  supportTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
