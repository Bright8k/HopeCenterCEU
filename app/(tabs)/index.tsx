import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useCEUProgress } from '@/hooks/useCEUProgress';
import { Colors } from '@/constants/Colors';
import { ROLE_LABELS, ROLE_CEU_REQUIREMENTS } from '@/constants/roles';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { user, role } = useAuth();
  const { progress, loading } = useCEUProgress();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';
  const roleRequirement = role ? ROLE_CEU_REQUIREMENTS[role] : null;
  const renewalYears = roleRequirement?.cycleYears ?? 2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {firstName}
          </Text>
          {role ? <Text style={styles.roleChip}>{ROLE_LABELS[role]}</Text> : null}
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressCardHeader}>
          <Text style={styles.progressCardTitle}>CEU Progress</Text>
          {roleRequirement && roleRequirement.total > 0 ? (
            <Text style={styles.progressCycle}>{renewalYears}-year cycle</Text>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
        ) : progress && roleRequirement && roleRequirement.total > 0 ? (
          <>
            <View style={styles.progressNumbers}>
              <Text style={styles.progressEarned}>{progress.earned.toFixed(1)}</Text>
              <Text style={styles.progressSeparator}> / {roleRequirement.total}</Text>
              <Text style={styles.progressUnit}> CEUs</Text>
            </View>

            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${progress.percentage}%` as const }]} />
            </View>
            <Text style={styles.progressPct}>{Math.round(progress.percentage)}% complete</Text>
          </>
        ) : role === 'STUDENT' ? (
          <Text style={styles.studentNote}>
            Focus on exam prep. There is no CEU requirement for Student Analysts.
          </Text>
        ) : (
          <Text style={styles.studentNote}>Complete courses to start earning CEUs.</Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Completed" value={progress ? String(progress.completedCourses) : '--'} />
        <StatCard label="CEUs Earned" value={progress ? progress.earned.toFixed(1) : '--'} />
        <StatCard label="Renewal In" value={`${renewalYears}yr`} />
      </View>

      <Text style={styles.sectionTitle}>Continue Learning</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>Library</Text>
        <Text style={styles.emptyTitle}>No courses in progress</Text>
        <Text style={styles.emptyText}>
          Head to {role === 'STUDENT' ? 'Courses' : 'CEU Library'} to get started.
        </Text>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  greetingRow: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  roleChip: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  progressCycle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progressNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progressEarned: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressSeparator: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  barTrack: {
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  progressPct: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  studentNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
