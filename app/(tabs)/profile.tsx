import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useCEUProgress } from '@/hooks/useCEUProgress';
import { Colors } from '@/constants/Colors';
import { ROLE_CEU_REQUIREMENTS, ROLE_LABELS } from '@/constants/roles';
import { hasSupabaseEnv } from '@/lib/supabase';

export default function ProfileScreen() {
  const { user, role, signOut } = useAuth();
  const { progress, loading } = useCEUProgress();

  const fullName = user?.user_metadata?.full_name ?? 'Hope Center Learner';
  const email = user?.email ?? 'No email connected yet';
  const initials = fullName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleRequirement = role ? ROLE_CEU_REQUIREMENTS[role] : null;
  const isStudent = role === 'STUDENT';
  const earned = progress?.earned ?? 0;
  const completed = progress?.completedCourses ?? 0;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to leave the Hope Center CEU app?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{email}</Text>
            <View style={styles.badgeRow}>
              <Badge
                label={role ? ROLE_LABELS[role] : 'Track not selected'}
                variant="accent"
              />
              <Badge
                label={hasSupabaseEnv ? 'Live profile' : 'Preview mode'}
                variant={hasSupabaseEnv ? 'success' : 'muted'}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard
          label={isStudent ? 'Study Sets' : 'Completed'}
          value={loading ? '--' : String(completed)}
          icon="checkmark-done-outline"
          accent={Colors.primary}
        />
        <MetricCard
          label={isStudent ? 'Track' : 'CEUs'}
          value={isStudent ? 'Exam' : loading ? '--' : earned.toFixed(1)}
          icon={isStudent ? 'school-outline' : 'ribbon-outline'}
          accent={Colors.accentDark}
        />
      </View>

      <Card variant="elevated" style={styles.summaryCard}>
        <Text style={styles.sectionEyebrow}>Professional summary</Text>
        <Text style={styles.sectionTitle}>Keep your profile organized</Text>
        <Text style={styles.summaryText}>
          {roleRequirement
            ? roleRequirement.description
            : 'Select a role during onboarding to tailor renewal guidance, learning tracks, and certificates.'}
        </Text>

        <View style={styles.summaryList}>
          <SummaryRow
            label={isStudent ? 'Primary focus' : 'Renewal cycle'}
            value={isStudent ? 'BCBA exam preparation' : roleRequirement ? `${roleRequirement.cycleYears} years` : '--'}
          />
          <SummaryRow
            label={isStudent ? 'Current mode' : 'Required total'}
            value={isStudent ? 'Board prep' : roleRequirement ? `${roleRequirement.total} CEUs` : '--'}
          />
          <SummaryRow
            label="Organization"
            value="Hope Center for Behavior Change"
          />
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Certificates and records</Text>
        <Text style={styles.sectionHint}>A clean home for your progress trail.</Text>
      </View>

      <Card style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <View style={styles.recordIconWrap}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.recordCopy}>
            <Text style={styles.recordTitle}>Completion certificates</Text>
            <Text style={styles.recordText}>
              Certificates will appear here as you complete courses and pass assessments.
            </Text>
          </View>
        </View>
        <Badge
          label={completed > 0 ? `${completed} ready` : 'None yet'}
          variant={completed > 0 ? 'success' : 'muted'}
        />
      </Card>

      <Card style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <View style={styles.recordIconWrap}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.recordCopy}>
            <Text style={styles.recordTitle}>Renewal planning</Text>
            <Text style={styles.recordText}>
              Track deadlines, renewal pace, and CEU progress from one place as the app grows.
            </Text>
          </View>
        </View>
        <Badge label={isStudent ? 'Prep mode' : 'Planning'} variant="accent" />
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account actions</Text>
        <Text style={styles.sectionHint}>The basics you will use often.</Text>
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/courses')}>
        <Card variant="elevated" style={styles.actionCard}>
          <View style={styles.actionIconWrap}>
            <Ionicons name="library-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>{isStudent ? 'Open study library' : 'Open CEU library'}</Text>
            <Text style={styles.actionDescription}>
              Jump back into your catalog and continue building progress.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </Card>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/index')}>
        <Card variant="elevated" style={styles.actionCard}>
          <View style={styles.actionIconWrap}>
            <Ionicons name="pulse-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Return to dashboard</Text>
            <Text style={styles.actionDescription}>
              Review your current pace, next steps, and encouragement at a glance.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </Card>
      </TouchableOpacity>

      <Button title="Sign Out" onPress={handleSignOut} variant="outline" style={styles.signOutButton} />
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconWrap, { backgroundColor: `${accent}14` }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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
  avatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.accent}CC`,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  heroCopy: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#F3E4F3',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  summaryCard: {
    marginBottom: 18,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.primary,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  summaryList: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
  },
  recordCard: {
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  recordIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}10`,
  },
  recordCopy: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  recordText: {
    fontSize: 13,
    lineHeight: 20,
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
  signOutButton: {
    marginTop: 6,
  },
});
