import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useCEURenewal, type RenewalStatus, type CategoryBreakdown } from '@/hooks/useCEURenewal';
import { ROLE_CEU_REQUIREMENTS, ROLE_LABELS } from '@/constants/roles';
import { formatRenewalDate } from '@/hooks/useProfile';
import { Typography, withAlpha } from '@/constants/theme';

const STATUS_CONFIG: Record<
  RenewalStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; message: string }
> = {
  complete:  { label: 'Complete',  icon: 'checkmark-circle',        color: 'success', message: 'You have met your renewal requirements. Excellent work!' },
  ahead:     { label: 'Ahead',     icon: 'trending-up-outline',     color: 'success', message: "You're earning CEUs faster than needed. Stay consistent." },
  on_track:  { label: 'On track',  icon: 'checkmark-circle-outline', color: 'primary', message: "You're on pace to meet your renewal deadline." },
  behind:    { label: 'Behind',    icon: 'alert-circle-outline',    color: 'accent',  message: 'Complete a course soon to get back on pace.' },
  overdue:   { label: 'Overdue',   icon: 'close-circle-outline',    color: 'error',   message: 'Your renewal deadline has passed. Contact Hope Center for guidance.' },
  no_date:   { label: 'Set date',  icon: 'help-circle-outline',     color: 'muted',   message: 'Add your renewal deadline in Profile to enable pace tracking.' },
};

export default function RenewalTrackerScreen() {
  const { role } = useAuth();
  const { colors, textScale } = usePreferences();
  const { data, loading } = useCEURenewal();
  const styles = createStyles(colors, textScale);

  function statusColor(key: string): string {
    if (key === 'success') return colors.success;
    if (key === 'error') return colors.error;
    if (key === 'accent') return colors.accentDark;
    if (key === 'primary') return colors.primary;
    return colors.textSecondary;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your tracker...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Student or no-role view
  if (!role || role === 'STUDENT') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Renewal Tracker</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingWrap}>
          <Ionicons name="school-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No renewal cycle</Text>
          <Text style={styles.emptyText}>
            Student Analysts do not have a CEU renewal requirement. Focus on your BCBA exam prep instead.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const req = ROLE_CEU_REQUIREMENTS[role];
  const isBCBA = role === 'BCBA';
  const status = data?.status ?? 'no_date';
  const cfg = STATUS_CONFIG[status];
  const statusClr = statusColor(cfg.color);

  function formatDaysRemaining(days: number | null): string {
    if (days === null) return '--';
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    return months > 0 ? `${years}y ${months}mo` : `${years} year${years > 1 ? 's' : ''}`;
  }

  const daysLabel = formatDaysRemaining(data?.daysRemaining ?? null);
  const daysUrgent = (data?.daysRemaining ?? 999) < 30 && (data?.daysRemaining ?? 0) >= 0;
  const daysColor = (data?.daysRemaining ?? 999) < 0
    ? colors.error
    : daysUrgent
      ? colors.accentDark
      : colors.text;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Renewal Tracker</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Role + deadline headline */}
        <View style={styles.roleRow}>
          <Badge label={ROLE_LABELS[role]} variant="primary" />
          <Badge label={`${req.total} CEUs / ${req.cycleYears} yrs`} variant="muted" />
        </View>

        {/* ── Countdown card ───────────────────────────────────────── */}
        <Card variant="elevated" style={styles.countdownCard}>
          <View style={styles.countdownTop}>
            <View style={styles.countdownCopy}>
              <Text style={styles.countdownLabel}>Renewal deadline</Text>
              <Text style={styles.countdownDate}>
                {data?.renewalDate ? formatRenewalDate(data.renewalDate) : 'Not set'}
              </Text>
            </View>
            <View style={styles.countdownNumber}>
              <Text style={[styles.countdownDays, { color: daysColor }]}>{daysLabel}</Text>
              {data?.renewalDate && (
                <Text style={styles.countdownRemaining}>
                  {(data?.daysRemaining ?? 0) >= 0 ? 'remaining' : ''}
                </Text>
              )}
            </View>
          </View>

          {data?.renewalDate && (
            <>
              <View style={styles.barRow}>
                <Text style={styles.barLabel}>Cycle time elapsed</Text>
                <Text style={styles.barValue}>
                  {Math.round(data?.timeElapsedPercent ?? 0)}%
                </Text>
              </View>
              <ProgressBar
                value={Math.round(data?.timeElapsedPercent ?? 0)}
                max={100}
                height={6}
                color={daysUrgent ? colors.accentDark : colors.primaryLight}
              />
            </>
          )}

          {!data?.renewalDate && (
            <Pressable
              onPress={() => router.push('/profile-edit')}
              accessibilityRole="button"
              accessibilityLabel="Set renewal date in profile"
              style={({ pressed }) => [styles.setDateBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.setDateText}>Set renewal date in Profile</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </Pressable>
          )}
        </Card>

        {/* ── CEU progress card ────────────────────────────────────── */}
        <Card variant="elevated" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressEyebrow}>CEU progress</Text>
              <Text style={styles.progressTitle}>
                {(data?.earnedCeus ?? 0).toFixed(1)} of {data?.requiredCeus ?? req.total} CEUs
              </Text>
            </View>
            <View style={[styles.percentBadge, { backgroundColor: withAlpha(colors.accent, '22') }]}>
              <Text style={[styles.percentValue, { color: colors.accentDark }]}>
                {Math.round(data?.ceuPercent ?? 0)}%
              </Text>
            </View>
          </View>
          <ProgressBar
            value={data?.earnedCeus ?? 0}
            max={data?.requiredCeus ?? req.total}
            height={10}
            color={colors.primary}
          />
          <Text style={styles.progressSub}>
            {(data?.requiredCeus ?? req.total) - (data?.earnedCeus ?? 0) > 0
              ? `${((data?.requiredCeus ?? req.total) - (data?.earnedCeus ?? 0)).toFixed(1)} CEUs remaining`
              : 'All CEUs earned this cycle!'}
          </Text>
        </Card>

        {/* ── Pace status ──────────────────────────────────────────── */}
        <Card style={[styles.statusCard, { borderColor: withAlpha(statusClr, '55') }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: withAlpha(statusClr, '18') }]}>
              <Ionicons name={cfg.icon} size={22} color={statusClr} />
            </View>
            <View style={styles.statusCopy}>
              <View style={styles.statusLabelRow}>
                <Text style={[styles.statusLabel, { color: statusClr }]}>{cfg.label}</Text>
              </View>
              <Text style={styles.statusMessage}>{cfg.message}</Text>
            </View>
          </View>
        </Card>

        {/* ── BCBA sub-requirements ─────────────────────────────────── */}
        {isBCBA && (
          <Card style={styles.reqCard}>
            <Text style={styles.reqTitle}>BACB category requirements</Text>
            <Text style={styles.reqHint}>
              CEU category is set per course. Courses without a category count toward General.
            </Text>
            <CategoryRow
              label="Ethics"
              required={4}
              earned={data?.categoryBreakdown.ethics ?? 0}
              colors={colors}
              textScale={textScale}
            />
            <CategoryRow
              label="Supervision"
              required={3}
              earned={data?.categoryBreakdown.supervision ?? 0}
              colors={colors}
              textScale={textScale}
            />
            <CategoryRow
              label="General / other"
              required={25}
              earned={data?.categoryBreakdown.general ?? 0}
              colors={colors}
              textScale={textScale}
            />
          </Card>
        )}

        {/* ── Completed course timeline ─────────────────────────────── */}
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>Completed this cycle</Text>
          <Text style={styles.timelineCount}>
            {(data?.completions ?? []).length} course{(data?.completions ?? []).length !== 1 ? 's' : ''}
          </Text>
        </View>

        {(data?.completions ?? []).length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="ribbon-outline" size={32} color={colors.textMuted} accessibilityElementsHidden />
            <Text style={styles.emptyTitle}>No courses yet</Text>
            <Text style={styles.emptyText}>
              Complete your first course to start building your renewal record.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/courses')}
              accessibilityRole="button"
              accessibilityLabel="Browse CEU library"
              style={({ pressed }) => [styles.setDateBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.setDateText}>Browse CEU library</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </Pressable>
          </Card>
        ) : (
          <View style={styles.timelineList}>
            {(data?.completions ?? []).map((c, i) => (
              <Card
                key={c.id}
                style={[styles.timelineCard, i === (data?.completions ?? []).length - 1 && styles.lastCard]}
              >
                <View style={styles.timelineRow}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineCopy}>
                    <Text style={styles.timelineCourse}>{c.title}</Text>
                    <Text style={styles.timelineMeta}>
                      {formatDate(c.completedAt)} · {c.ceuValue} CEU{c.ceuValue !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Badge label={`${c.ceuValue} CEU`} variant="success" />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function BackButton() {
    return (
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
    );
  }

}

function CategoryRow({
  label,
  required,
  earned,
  colors,
  textScale,
}: {
  label: string;
  required: number;
  earned: number;
  colors: ReturnType<typeof usePreferences>['colors'];
  textScale: number;
}) {
  const capped = Math.min(earned, required);
  const met = capped >= required;
  const barColor = met ? colors.success : colors.primary;

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 13 * textScale, fontFamily: Typography.bodyBold, color: met ? colors.success : colors.textSecondary }}>
          {earned.toFixed(1)} / {required}
        </Text>
      </View>
      <ProgressBar value={capped} max={required} height={5} color={barColor} />
    </View>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: 32,
    },
    loadingText: { fontSize: 15 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    headerTitle: {
      flex: 1,
      fontSize: 17 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      textAlign: 'center',
    },
    headerRight: { width: 44 },
    content: { padding: 16, paddingBottom: 36 },
    roleRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    // Countdown card
    countdownCard: { marginBottom: 12 },
    countdownTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    countdownCopy: { flex: 1 },
    countdownLabel: {
      fontSize: 12 * textScale,
      fontFamily: Typography.bodyBold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: 4,
    },
    countdownDate: {
      fontSize: 20 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
    },
    countdownNumber: { alignItems: 'flex-end' },
    countdownDays: {
      fontSize: 26 * textScale,
      fontFamily: Typography.heading,
    },
    countdownRemaining: {
      fontSize: 11 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary,
    },
    barRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    barLabel: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    barValue: { fontSize: 12 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    setDateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      marginTop: 10,
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: withAlpha(colors.primary, '0E'),
    },
    setDateText: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primary,
    },
    // Progress card
    progressCard: { marginBottom: 12 },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    progressEyebrow: {
      fontSize: 12 * textScale,
      fontFamily: Typography.bodyBold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: 4,
    },
    progressTitle: {
      fontSize: 20 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
    },
    percentBadge: {
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minWidth: 60,
      alignItems: 'center',
    },
    percentValue: {
      fontSize: 18 * textScale,
      fontFamily: Typography.bodyBold,
    },
    progressSub: {
      marginTop: 10,
      fontSize: 13 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    // Status card
    statusCard: { marginBottom: 12, borderWidth: 1 },
    statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    statusIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusCopy: { flex: 1 },
    statusLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    statusLabel: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
    },
    statusMessage: {
      fontSize: 13 * textScale,
      lineHeight: 19,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    // Requirements card
    reqCard: { marginBottom: 12 },
    reqTitle: {
      fontSize: 14 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 4,
    },
    reqHint: {
      fontSize: 12 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 18,
    },
    reqList: { gap: 10 },
    reqRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    reqLabel: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text },
    reqValue: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    // Timeline
    timelineHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    timelineTitle: {
      fontSize: 17 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
    },
    timelineCount: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primary,
    },
    timelineList: { gap: 0 },
    timelineCard: { marginBottom: 10, borderRadius: 14 },
    lastCard: { marginBottom: 0 },
    timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
      flexShrink: 0,
    },
    timelineCopy: { flex: 1 },
    timelineCourse: {
      fontSize: 14 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 2,
    },
    timelineMeta: {
      fontSize: 12 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 24 },
    emptyTitle: {
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
    },
    emptyText: {
      fontSize: 13 * textScale,
      lineHeight: 19,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
