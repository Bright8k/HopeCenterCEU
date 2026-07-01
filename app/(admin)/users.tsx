import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePreferences } from '@/context/PreferencesContext';
import { useAdminUsers, type AdminUserSummary } from '@/hooks/useAdminUsers';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { formatRenewalDate } from '@/hooks/useProfile';
import { Typography, withAlpha } from '@/constants/theme';

type RoleFilter = 'ALL' | 'RBT' | 'BCBA' | 'STUDENT';
const ROLE_FILTERS: RoleFilter[] = ['ALL', 'RBT', 'BCBA', 'STUDENT'];

type UserSort = 'activity' | 'name' | 'ceu' | 'streak';
const SORT_OPTIONS: { label: string; value: UserSort; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Active', value: 'activity', icon: 'trending-up-outline' },
  { label: 'Name', value: 'name', icon: 'text-outline' },
  { label: 'CEU', value: 'ceu', icon: 'ribbon-outline' },
  { label: 'Streak', value: 'streak', icon: 'flame-outline' },
];

export default function AdminUsersScreen() {
  const { colors, textScale } = usePreferences();
  const { users, loading } = useAdminUsers();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [sort, setSort] = useState<UserSort>('activity');
  const styles = createStyles(colors, textScale);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = users.filter((u) => {
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchQ = !q || u.displayName.toLowerCase().includes(q);
      return matchRole && matchQ;
    });
    if (sort === 'name') list = [...list].sort((a, b) => a.displayName.localeCompare(b.displayName));
    else if (sort === 'ceu') list = [...list].sort((a, b) => b.totalCeus - a.totalCeus);
    else if (sort === 'streak') list = [...list].sort((a, b) => b.currentStreak - a.currentStreak);
    // 'activity' keeps the default sort from hook (most completions first)
    return list;
  }, [users, query, roleFilter, sort]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name…"
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                autoCapitalize="none"
                accessibilityLabel="Search learners"
              />
            </View>
            <View style={styles.filterRow} accessibilityRole="radiogroup" accessibilityLabel="Filter by role">
              {ROLE_FILTERS.map((r) => {
                const active = r === roleFilter;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRoleFilter(r)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={r === 'ALL' ? 'All roles' : r}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {r === 'ALL' ? 'All' : r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Sort strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortRow}
              accessibilityLabel="Sort learners"
            >
              {SORT_OPTIONS.map((opt) => {
                const active = sort === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSort(opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={`Sort by ${opt.label}`}
                    style={({ pressed }) => [
                      styles.sortChip,
                      active && styles.sortChipActive,
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={12}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Learners</Text>
              <Text style={styles.sectionCount}>{filtered.length}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No learners found</Text>
            <Text style={styles.emptyText}>
              Learners appear here once they complete onboarding and set a role.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <UserRow user={item} colors={colors} textScale={textScale} styles={styles} />
        )}
      />

      {/* Invite learner FAB */}
      <Pressable
        onPress={() => router.push('/(admin)/invite')}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
        accessibilityRole="button"
        accessibilityLabel="Invite a new learner"
        accessibilityHint="Opens a form to send an account invitation by email"
      >
        <Ionicons name="person-add-outline" size={20} color="#fff" />
        <Text style={styles.fabLabel}>Invite</Text>
      </Pressable>
    </View>
  );
}

function UserRow({
  user, colors, textScale, styles,
}: {
  user: AdminUserSummary;
  colors: ReturnType<typeof usePreferences>['colors'];
  textScale: number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <InteractivePressable
      onPress={() => router.push(`/(admin)/user-detail?id=${user.id}`)}
      style={styles.rowPressable}
      accessibilityLabel={`View ${user.displayName}`}
      accessibilityHint="Opens user detail"
    >
      {({ hovered }) => (
        <Card
          variant="elevated"
          style={[styles.row, hovered && { borderColor: withAlpha(colors.primary, '44') }]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.displayName[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.copy}>
            <Text style={styles.name} numberOfLines={1}>{user.displayName}</Text>
            <View style={styles.metaRow}>
              <Badge label={user.role} variant="primary" />
              {user.renewalDate && (
                <Text style={styles.renewal}>{formatRenewalDate(user.renewalDate)}</Text>
              )}
            </View>
          </View>
          <View style={styles.stats}>
            <Text style={styles.statMain}>{user.totalCeus.toFixed(1)}</Text>
            <Text style={styles.statSub}>CEU</Text>
            {user.currentStreak > 0 && (
              <Text style={styles.streak}>🔥 {user.currentStreak}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Card>
      )}
    </InteractivePressable>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 100 },
    searchWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderWidth: 1, borderColor: colors.border, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 11,
      backgroundColor: colors.surface, marginBottom: 10,
    },
    searchInput: {
      flex: 1, fontSize: 15 * textScale, fontFamily: Typography.body, color: colors.text,
    },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
    chip: {
      borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
      overflow: 'hidden', minHeight: 36, alignItems: 'center', justifyContent: 'center',
    },
    chipActive: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, '14') },
    chipText: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    chipTextActive: { color: colors.primary },
    sortRow: { gap: 6, paddingRight: 4, marginBottom: 14 },
    sortChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
      minHeight: 30,
    },
    sortChipActive: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, '14') },
    sortChipText: { fontSize: 12 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    sortChipTextActive: { color: colors.primary },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 17 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    sectionCount: { fontSize: 13 * textScale, fontFamily: Typography.bodyBold, color: colors.primary },
    emptyCard: { alignItems: 'center', paddingVertical: 28, gap: 8 },
    emptyTitle: { fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    emptyText: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary, textAlign: 'center' },
    rowPressable: { marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
      width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '14'), flexShrink: 0,
    },
    avatarText: { fontSize: 17 * textScale, fontFamily: Typography.bodyBold, color: colors.primary },
    copy: { flex: 1, gap: 5 },
    name: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    renewal: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    stats: { alignItems: 'flex-end', gap: 2 },
    statMain: { fontSize: 17 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    statSub: { fontSize: 10 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
    streak: { fontSize: 11 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    fab: {
      position: 'absolute', bottom: 24, right: 20,
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.primary, borderRadius: 28,
      paddingHorizontal: 20, paddingVertical: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18, shadowRadius: 8, elevation: 6,
    },
    fabLabel: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.white },
  });
