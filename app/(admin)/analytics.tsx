import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences } from '@/context/PreferencesContext';
import { useAdminAnalytics, type AnalyticsPeriod, type CourseStat, type RecentCompletion } from '@/hooks/useAdminAnalytics';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Typography, withAlpha } from '@/constants/theme';

const PERIOD_OPTIONS: { label: string; value: AnalyticsPeriod }[] = [
  { label: 'This month', value: 'month' },
  { label: 'This year', value: 'year' },
  { label: 'All time', value: 'all' },
];

export default function AnalyticsScreen() {
  const { colors, textScale } = usePreferences();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const { data, loading } = useAdminAnalytics(period);
  const styles = createStyles(colors, textScale);

  const summary = data?.summary;

  return (
    <FlatList
      data={data?.courseStats ?? []}
      keyExtractor={(item) => item.courseId}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <>
          {/* Period filter */}
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map((opt) => {
              const active = period === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPeriod(opt.value)}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.periodChip,
                    active && styles.periodChipActive,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Summary stats */}
          <View style={styles.summaryRow}>
            <SummaryTile
              label="Attempts"
              value={loading ? '--' : String(summary?.totalAttempts ?? 0)}
              icon="layers-outline"
              color={colors.primary}
              styles={styles}
            />
            <SummaryTile
              label="Pass rate"
              value={loading ? '--' : `${summary?.passRate ?? 0}%`}
              icon="checkmark-circle-outline"
              color={colors.success}
              styles={styles}
            />
            <SummaryTile
              label="Learners"
              value={loading ? '--' : String(summary?.uniqueLearners ?? 0)}
              icon="people-outline"
              color={colors.accentDark}
              styles={styles}
            />
            <SummaryTile
              label="CEUs"
              value={loading ? '--' : (summary?.ceusAwarded ?? 0).toFixed(1)}
              icon="ribbon-outline"
              color={colors.primaryLight}
              styles={styles}
            />
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}

          {!loading && (data?.courseStats.length ?? 0) > 0 && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Course performance</Text>
              <Text style={styles.sectionSub}>{data!.courseStats.length} courses</Text>
            </View>
          )}
        </>
      }
      ListEmptyComponent={
        !loading ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>
              Completions will appear here once learners submit quizzes.
            </Text>
          </Card>
        ) : null
      }
      renderItem={({ item }) => <CourseRow item={item} colors={colors} textScale={textScale} styles={styles} />}
      ListFooterComponent={
        !loading && (data?.recentCompletions.length ?? 0) > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <Text style={styles.sectionSub}>Last 15</Text>
            </View>
            {data!.recentCompletions.map((c) => (
              <RecentRow key={c.id} item={c} colors={colors} textScale={textScale} styles={styles} />
            ))}
          </View>
        ) : null
      }
    />
  );
}

function SummaryTile({
  label, value, icon, color, styles,
}: {
  label: string; value: string; icon: keyof typeof Ionicons.glyphMap;
  color: string; styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.summaryTile}>
      <View style={[styles.summaryIcon, { backgroundColor: withAlpha(color, '20') }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function CourseRow({
  item, colors, textScale, styles,
}: {
  item: CourseStat;
  colors: ReturnType<typeof usePreferences>['colors'];
  textScale: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const passColor =
    item.passRate >= 80 ? colors.success : item.passRate >= 60 ? colors.accentDark : colors.error;

  return (
    <Card variant="elevated" style={styles.courseRow}>
      <View style={styles.courseRowTop}>
        <View style={styles.courseRowCopy}>
          <Text style={styles.courseRowTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.courseRowMeta}>
            {item.track && <Badge label={item.track} variant="primary" />}
            <Badge label={`${item.ceuValue} CEU`} variant="success" />
          </View>
        </View>
        <View style={styles.courseRowStats}>
          <Text style={[styles.passRateValue, { color: passColor }]}>{item.passRate}%</Text>
          <Text style={styles.attemptsLabel}>{item.attempts} attempt{item.attempts !== 1 ? 's' : ''}</Text>
        </View>
      </View>
      <ProgressBar value={item.passes} max={Math.max(item.attempts, 1)} color={passColor} />
      <Text style={styles.avgScore}>Avg score {item.avgScore}%</Text>
    </Card>
  );
}

function RecentRow({
  item, colors, textScale, styles,
}: {
  item: RecentCompletion;
  colors: ReturnType<typeof usePreferences>['colors'];
  textScale: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const date = new Date(item.completedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  return (
    <View style={styles.recentRow}>
      <View style={[styles.recentDot, { backgroundColor: item.passed ? colors.success : colors.error }]} />
      <View style={styles.recentCopy}>
        <Text style={styles.recentName} numberOfLines={1}>{item.displayName}</Text>
        <Text style={styles.recentCourse} numberOfLines={1}>{item.courseTitle}</Text>
      </View>
      <View style={styles.recentRight}>
        <Text style={[styles.recentScore, { color: item.passed ? colors.success : colors.error }]}>
          {item.score}%
        </Text>
        <Text style={styles.recentDate}>{date}</Text>
      </View>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    content: { padding: 16, paddingBottom: 40, backgroundColor: colors.background },
    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
    periodChip: {
      borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
      overflow: 'hidden',
    },
    periodChipActive: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, '14') },
    periodChipText: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    periodChipTextActive: { color: colors.primary },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    summaryTile: {
      flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 6,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    summaryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    summaryValue: { fontSize: 18 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    summaryLabel: { fontSize: 10 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
    loadingRow: { paddingVertical: 24, alignItems: 'center' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 17 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    sectionSub: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.primary },
    emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 10 },
    emptyTitle: { fontSize: 17 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    emptyText: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary, textAlign: 'center' },
    courseRow: { marginBottom: 10 },
    courseRowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    courseRowCopy: { flex: 1, gap: 6 },
    courseRowTitle: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    courseRowMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    courseRowStats: { alignItems: 'flex-end' },
    passRateValue: { fontSize: 20 * textScale, fontFamily: Typography.headingSemiBold },
    attemptsLabel: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    avgScore: { marginTop: 6, fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    recentSection: { marginTop: 6 },
    recentRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    recentDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    recentCopy: { flex: 1 },
    recentName: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginBottom: 2 },
    recentCourse: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    recentRight: { alignItems: 'flex-end' },
    recentScore: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold },
    recentDate: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
  });
