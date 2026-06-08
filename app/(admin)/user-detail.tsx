import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { usePreferences } from '@/context/PreferencesContext';
import { useAdminUserDetail, type AdminUserCompletion } from '@/hooks/useAdminUsers';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatRenewalDate } from '@/hooks/useProfile';
import { ROLE_CEU_REQUIREMENTS } from '@/constants/roles';
import { Typography, withAlpha } from '@/constants/theme';

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textScale } = usePreferences();
  const { detail, loading } = useAdminUserDetail(id ?? '');
  const styles = createStyles(colors, textScale);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>User not found</Text>
      </View>
    );
  }

  const req = ROLE_CEU_REQUIREMENTS[detail.role as keyof typeof ROLE_CEU_REQUIREMENTS];
  const passedCompletions = detail.completions.filter((c) => c.passed);
  const earnedCeus = passedCompletions.reduce((sum, c) => sum + c.ceuValue, 0);
  const requiredCeus = req?.total ?? 0;
  const ceuPercent = requiredCeus > 0 ? Math.min(100, (earnedCeus / requiredCeus) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header card */}
      <Card variant="elevated" style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{detail.displayName[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.displayName}>{detail.displayName}</Text>
            <View style={styles.badgeRow}>
              <Badge label={detail.role} variant="primary" />
              {detail.currentStreak > 0 && (
                <Badge label={`🔥 ${detail.currentStreak}-day streak`} variant="accent" />
              )}
            </View>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <MetaTile
            label="Renewal"
            value={detail.renewalDate ? formatRenewalDate(detail.renewalDate) : 'Not set'}
            icon="calendar-outline"
            colors={colors}
            textScale={textScale}
          />
          <MetaTile
            label="Completions"
            value={String(passedCompletions.length)}
            icon="checkmark-circle-outline"
            colors={colors}
            textScale={textScale}
          />
          <MetaTile
            label="Best streak"
            value={`${detail.longestStreak} days`}
            icon="flame-outline"
            colors={colors}
            textScale={textScale}
          />
        </View>
      </Card>

      {/* CEU progress (professional roles only) */}
      {req && (
        <Card variant="elevated" style={styles.ceuCard}>
          <View style={styles.ceuHeader}>
            <Text style={styles.ceuTitle}>CEU Progress</Text>
            <Text style={styles.ceuCount}>{earnedCeus.toFixed(1)} / {requiredCeus}</Text>
          </View>
          <ProgressBar value={earnedCeus} max={requiredCeus} color={colors.primary} />
          <Text style={styles.ceuSub}>
            {Math.round(ceuPercent)}% complete · {req.cycleYears}-year renewal cycle
          </Text>
        </Card>
      )}

      {/* Completion history */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Activity history</Text>
        <Text style={styles.sectionCount}>{detail.completions.length}</Text>
      </View>

      {detail.completions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No quiz attempts yet.</Text>
        </Card>
      ) : (
        detail.completions.map((c) => (
          <CompletionRow key={c.id} item={c} colors={colors} textScale={textScale} styles={styles} />
        ))
      )}
    </ScrollView>
  );
}

function MetaTile({
  label, value, icon, colors, textScale,
}: {
  label: string; value: string; icon: keyof typeof Ionicons.glyphMap;
  colors: ReturnType<typeof usePreferences>['colors']; textScale: number;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <Text style={{ fontSize: 13 * textScale, fontFamily: Typography.bodyBold, color: colors.text, textAlign: 'center' }}>
        {value}
      </Text>
      <Text style={{ fontSize: 10 * textScale, fontFamily: Typography.body, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </Text>
    </View>
  );
}

function CompletionRow({
  item, colors, textScale, styles,
}: {
  item: AdminUserCompletion;
  colors: ReturnType<typeof usePreferences>['colors'];
  textScale: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const date = new Date(item.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <View style={styles.compRow}>
      <View style={[styles.compDot, { backgroundColor: item.passed ? colors.success : colors.error }]} />
      <View style={styles.compCopy}>
        <Text style={styles.compTitle} numberOfLines={1}>{item.courseTitle}</Text>
        <Text style={styles.compDate}>{date}</Text>
      </View>
      <View style={styles.compRight}>
        <Text style={[styles.compScore, { color: item.passed ? colors.success : colors.error }]}>
          {item.score}%
        </Text>
        {item.passed && item.ceuValue > 0 && (
          <Text style={styles.compCeu}>{item.ceuValue} CEU</Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.background },
    emptyTitle: { fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.textSecondary },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40, gap: 14 },
    headerCard: { gap: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
      width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '16'), flexShrink: 0,
    },
    avatarText: { fontSize: 22 * textScale, fontFamily: Typography.bodyBold, color: colors.primary },
    headerCopy: { flex: 1, gap: 6 },
    displayName: { fontSize: 20 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    metaGrid: {
      flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border,
      paddingTop: 14, gap: 8,
    },
    ceuCard: { gap: 10 },
    ceuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ceuTitle: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    ceuCount: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.primary },
    ceuSub: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 17 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    sectionCount: { fontSize: 13 * textScale, fontFamily: Typography.bodyBold, color: colors.primary },
    emptyCard: { paddingVertical: 20, alignItems: 'center' },
    emptyText: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    compRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    compDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    compCopy: { flex: 1 },
    compTitle: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginBottom: 2 },
    compDate: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    compRight: { alignItems: 'flex-end' },
    compScore: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold },
    compCeu: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
  });
