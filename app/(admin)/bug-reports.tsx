import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Typography, withAlpha } from '@/constants/theme';

interface BugReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved'] as const;
const STATUS_LABELS: Record<string, string> = {
  open:        'Open',
  in_progress: 'In Progress',
  resolved:    'Resolved',
};
const STATUS_COLORS: Record<string, 'error' | 'warning' | 'success'> = {
  open:        'error',
  in_progress: 'warning',
  resolved:    'success',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function toTitleCase(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BugReportsScreen() {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);

  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  const load = useCallback(async () => {
    if (!hasSupabaseEnv) { setLoading(false); return; }
    setLoading(true);
    // bug_reports not yet in generated types; cast removed once `supabase gen types` is run
    const q = (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('bug_reports')
      .select('id, user_id, title, description, category, status, admin_notes, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (filter !== 'all') q.eq('status', filter);
    const { data } = await q;
    setReports((data as BugReport[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  async function changeStatus(report: BugReport) {
    const buttons = STATUS_OPTIONS
      .filter((s) => s !== report.status)
      .map((s) => ({
        text: STATUS_LABELS[s],
        onPress: async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('bug_reports').update({ status: s }).eq('id', report.id);
          void load();
        },
      }));

    Alert.alert(
      'Change status',
      `"${report.title}"\nCurrent: ${STATUS_LABELS[report.status]}`,
      [...buttons, { text: 'Cancel', style: 'cancel' as const }],
    );
  }

  const statusColor = (status: string) => {
    const key = STATUS_COLORS[status] ?? 'primary';
    return colors[key as keyof typeof colors] as string;
  };

  const openCount  = reports.filter((r) => r.status === 'open').length;
  const inProgCount = reports.filter((r) => r.status === 'in_progress').length;

  return (
    <View style={styles.container}>
      {/* ── Summary strip ── */}
      <View style={styles.strip}>
        <View style={styles.stripItem} accessibilityRole="text" accessibilityLabel={`${openCount} open reports`}>
          <Text style={[styles.stripValue, { color: colors.error }]}>{openCount}</Text>
          <Text style={styles.stripLabel}>Open</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem} accessibilityRole="text" accessibilityLabel={`${inProgCount} in progress`}>
          <Text style={[styles.stripValue, { color: colors.warning }]}>{inProgCount}</Text>
          <Text style={styles.stripLabel}>In Progress</Text>
        </View>
        <View style={styles.stripDivider} />
        <View
          style={styles.stripItem}
          accessibilityRole="text"
          accessibilityLabel={`${reports.filter((r) => r.status === 'resolved').length} resolved`}
        >
          <Text style={[styles.stripValue, { color: colors.success }]}>
            {reports.filter((r) => r.status === 'resolved').length}
          </Text>
          <Text style={styles.stripLabel}>Resolved</Text>
        </View>
      </View>

      {/* ── Filter chips ── */}
      <View style={styles.filters}>
        {(['all', 'open', 'in_progress', 'resolved'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            accessibilityRole="radio"
            accessibilityState={{ checked: filter === f }}
            accessibilityLabel={f === 'all' ? 'Show all' : STATUS_LABELS[f]}
            style={({ pressed }) => [
              styles.filterChip,
              filter === f && { backgroundColor: withAlpha(colors.primary, '14'), borderColor: colors.primary },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={[styles.filterText, filter === f && { color: colors.primary }]}>
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} accessibilityElementsHidden />
          <Text style={styles.emptyTitle}>No reports</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' ? 'No bug reports submitted yet.' : `No ${STATUS_LABELS[filter]?.toLowerCase()} reports.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardMeta}>
                  <View style={[styles.categoryChip, { backgroundColor: withAlpha(colors.primary, '10') }]}>
                    <Text style={[styles.categoryText, { color: colors.primary }]}>
                      {toTitleCase(item.category)}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: withAlpha(statusColor(item.status), '14') }]}>
                    <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => changeStatus(item)}
                  accessibilityRole="button"
                  accessibilityLabel="Change status"
                  style={({ pressed }) => [styles.statusBtn, pressed && { opacity: 0.65 }]}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>

              <View style={styles.footer}>
                <Text style={styles.meta}>
                  {formatDate(item.created_at)} · {item.user_id.slice(0, 8)}…
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    emptyTitle: { fontSize: 18 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    emptyText: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textSecondary, textAlign: 'center' },
    strip: {
      flexDirection: 'row', backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    stripItem: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
    stripDivider: { width: 1, backgroundColor: colors.border, marginVertical: 12 },
    stripValue: { fontSize: 22 * textScale, fontFamily: Typography.bodyExtraBold, lineHeight: 26 },
    stripLabel: { fontSize: 10 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textMuted, letterSpacing: 0.4 },
    filters: {
      flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    filterChip: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    filterText: { fontSize: 12 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    list: { padding: 14, gap: 10, paddingBottom: 40 },
    card: {
      backgroundColor: colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, padding: 14,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    cardMeta: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    categoryChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    categoryText: { fontSize: 11 * textScale, fontFamily: Typography.bodyBold },
    statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 11 * textScale, fontFamily: Typography.bodyBold },
    statusBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginBottom: 6, lineHeight: 21 },
    desc: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary, lineHeight: 19, marginBottom: 10 },
    footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
    meta: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textMuted },
  });
