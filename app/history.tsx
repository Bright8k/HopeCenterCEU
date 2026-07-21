import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { useCompletionHistory } from '@/hooks/useCompletionHistory';
import { Typography, withAlpha } from '@/constants/theme';

export default function HistoryScreen() {
  const { colors, textScale } = usePreferences();
  const { records, loading, refetch } = useCompletionHistory();
  const styles = createStyles(colors, textScale);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading completion history" />
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="school-outline" size={52} color={colors.textMuted} accessibilityElementsHidden />
        <Text style={styles.emptyTitle}>No completions yet</Text>
        <Text style={styles.emptyText}>
          Finish a course quiz to see your scores and certificates here.
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)/courses')}
          accessibilityRole="button"
          accessibilityLabel="Browse course library"
          style={({ pressed }) => [styles.browseBtn, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.browseBtnText}>Browse courses</Text>
        </Pressable>
      </View>
    );
  }

  const passed = records.filter((r) => r.passed).length;
  const totalCeu = records
    .filter((r) => r.passed)
    .reduce((sum, r) => sum + r.ceuValue, 0);

  return (
    <FlatList
      data={records}
      keyExtractor={(r) => r.id}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      refreshing={loading}
      onRefresh={refetch}
      ListHeaderComponent={
        <View style={styles.summary} accessibilityRole="summary" accessibilityLabel={`${records.length} attempts, ${passed} passed, ${totalCeu.toFixed(1)} CEUs earned`}>
          <SummaryTile label="Attempts" value={String(records.length)} icon="list-outline" color={colors.primary} />
          <SummaryTile label="Passed" value={String(passed)} icon="checkmark-done-outline" color={colors.success} />
          <SummaryTile label="CEUs earned" value={totalCeu.toFixed(1)} icon="ribbon-outline" color={colors.accentDark} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            if (item.passed) {
              router.push(`/certificate/${item.id}`);
            } else {
              router.push(`/quiz/${item.courseId}`);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={`${item.courseTitle} — ${item.passed ? 'passed' : 'not passed'}${item.score !== null ? `, score ${item.score}%` : ''}`}
          accessibilityHint={item.passed ? 'Opens your certificate' : 'Opens the quiz to retry'}
        >
          <Card style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.iconWrap, { backgroundColor: withAlpha(item.passed ? colors.success : colors.textMuted, '18') }]}>
                <Ionicons
                  name={item.passed ? 'checkmark-circle' : 'close-circle'}
                  size={22}
                  color={item.passed ? colors.success : colors.textMuted}
                  accessibilityElementsHidden
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.courseTitle} numberOfLines={2}>{item.courseTitle}</Text>
                <Text style={styles.dateLine}>{formatDate(item.completedAt)}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
                accessibilityElementsHidden
              />
            </View>

            <View style={styles.metaRow}>
              <Badge
                label={item.passed ? 'Passed' : 'Not passed'}
                variant={item.passed ? 'success' : 'muted'}
              />
              {item.score !== null && (
                <Badge label={`${item.score}%`} variant={item.passed ? 'accent' : 'muted'} />
              )}
              {item.ceuValue > 0 && item.passed && (
                <Badge label={`${item.ceuValue} CEU${item.ceuValue !== 1 ? 's' : ''}`} variant="primary" />
              )}
            </View>
          </Card>
        </Pressable>
      )}
    />
  );

  function SummaryTile({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
    return (
      <View style={styles.summaryTile}>
        <Ionicons name={icon} size={18} color={color} accessibilityElementsHidden />
        <Text style={[styles.summaryValue, { color }]}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    );
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    centered: {
      flex: 1, backgroundColor: colors.background,
      alignItems: 'center', justifyContent: 'center',
      padding: 36, gap: 12,
    },
    emptyTitle: {
      fontSize: 18 * textScale, fontFamily: Typography.bodyBold, color: colors.text,
    },
    emptyText: {
      fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textSecondary,
      textAlign: 'center', lineHeight: 21,
    },
    browseBtn: {
      marginTop: 4, paddingVertical: 10, paddingHorizontal: 24,
      borderRadius: 10, backgroundColor: withAlpha(colors.primary, '12'),
    },
    browseBtnText: {
      fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.primary,
    },
    list: { padding: 16, paddingBottom: 40 },
    summary: {
      flexDirection: 'row', gap: 10, marginBottom: 16,
    },
    summaryTile: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      padding: 14, alignItems: 'center', gap: 4,
    },
    summaryValue: {
      fontSize: 20 * textScale, fontFamily: Typography.headingSemiBold,
    },
    summaryLabel: {
      fontSize: 11 * textScale, fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    card: { marginBottom: 10 },
    cardTop: {
      flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    },
    iconWrap: {
      width: 42, height: 42, borderRadius: 13,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    cardBody: { flex: 1 },
    courseTitle: {
      fontSize: 14 * textScale, fontFamily: Typography.bodyBold,
      color: colors.text, marginBottom: 3, lineHeight: 20,
    },
    dateLine: {
      fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary,
    },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  });
