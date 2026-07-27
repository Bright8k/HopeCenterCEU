import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useStreak } from '@/hooks/useStreak';
import { useLeaderboard, type LeaderboardEntry, type LeaderboardPeriod, type LeaderboardRole } from '@/hooks/useLeaderboard';
import { Card } from '@/components/ui/Card';
import { Typography, withAlpha } from '@/constants/theme';

// Gold / silver / bronze — intentionally not in the brand token system
const RANK_COLORS = ['#C9A84C', '#8E9196', '#B07D50'] as const;
const RANK_ICONS = ['trophy', 'medal', 'ribbon'] as const;

const PERIOD_OPTIONS: { label: string; value: LeaderboardPeriod }[] = [
  { label: 'All time', value: 'all' },
  { label: 'This year', value: 'year' },
  { label: 'This month', value: 'month' },
];

const ROLE_OPTIONS: { label: string; value: LeaderboardRole }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'RBT', value: 'RBT' },
  { label: 'BCBA', value: 'BCBA' },
];

export default function LeaderboardScreen() {
  const { user, role } = useAuth();
  const { colors, textScale } = usePreferences();
  const { data: streak } = useStreak();
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [roleFilter, setRoleFilter] = useState<LeaderboardRole>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const { entries, loading, refetch } = useLeaderboard(roleFilter, period);

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }
  const styles = createStyles(colors, textScale);

  const userRank = entries.findIndex((e) => e.userId === user?.id) + 1;
  const userEntry = userRank > 0 ? entries[userRank - 1] : null;

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.userId}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <>
          {/* ── My rank card ── */}
          <Pressable
            onPress={() => router.push('/renewal-tracker')}
            accessibilityRole="button"
            accessibilityLabel="View your renewal tracker"
            style={({ pressed }) => [styles.myCard, pressed && { opacity: 0.88 }]}
          >
            <View style={styles.myCardRow}>
              <View style={styles.myAvatar}>
                {userEntry?.avatarUrl ? (
                  <Image
                    source={{ uri: userEntry.avatarUrl }}
                    style={styles.myAvatarImage}
                    accessibilityLabel="Your profile photo"
                  />
                ) : (
                  <Text style={styles.myAvatarText}>
                    {(user?.user_metadata?.full_name as string | undefined)?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                )}
              </View>
              <View style={styles.myInfo}>
                <Text style={styles.myName} numberOfLines={1}>
                  {(user?.user_metadata?.full_name as string | undefined) ?? 'You'}
                </Text>
                <View style={styles.myStats}>
                  <Text style={styles.myStat}>
                    {userRank > 0 ? `#${userRank} ranked` : 'Unranked'}
                  </Text>
                  {userEntry && (
                    <Text style={styles.myStat}>· {userEntry.totalCeus.toFixed(1)} CEU</Text>
                  )}
                </View>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakFlame}>🔥</Text>
                <Text style={styles.streakCount}>{streak?.currentStreak ?? 0}</Text>
              </View>
            </View>
          </Pressable>

          {/* ── Period filter ── */}
          <View style={styles.filterRow}>
            {PERIOD_OPTIONS.map((opt) => {
              const active = period === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPeriod(opt.value)}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Role filter ── */}
          <View style={[styles.filterRow, { marginBottom: 16 }]}>
            {ROLE_OPTIONS.map((opt) => {
              const active = roleFilter === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setRoleFilter(opt.value)}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rankings</Text>
            <Text style={styles.sectionCount}>{entries.length}</Text>
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </>
      }
      ListEmptyComponent={
        !loading ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptyText}>
              Complete a course to appear on the leaderboard.
            </Text>
          </Card>
        ) : null
      }
      renderItem={({ item, index }) => (
        <RankRow
          entry={item}
          rank={index + 1}
          isCurrentUser={item.userId === user?.id}
          colors={colors}
          textScale={textScale}
          styles={styles}
        />
      )}
    />
  );
}

function RankRow({
  entry,
  rank,
  isCurrentUser,
  colors,
  textScale,
  styles,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  colors: ReturnType<typeof usePreferences>['colors'];
  textScale: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const medalColor = rank <= 3 ? RANK_COLORS[rank - 1] : null;

  return (
    <View
      style={[
        styles.row,
        isCurrentUser && styles.rowHighlighted,
        rank === 1 && styles.rowFirst,
      ]}
    >
      {/* Rank */}
      <View style={[styles.rankBadge, medalColor ? { backgroundColor: withAlpha(medalColor, '22') } : {}]}>
        {rank <= 3 ? (
          <Ionicons
            name={RANK_ICONS[rank - 1] as any}
            size={16}
            color={medalColor!}
          />
        ) : (
          <Text style={[styles.rankNum, { color: colors.textSecondary }]}>
            {rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatar, isCurrentUser && styles.avatarMe]}>
        {entry.avatarUrl ? (
          <Image
            source={{ uri: entry.avatarUrl }}
            style={styles.avatarImage}
            accessibilityLabel={`${entry.displayName} profile photo`}
          />
        ) : (
          <Text style={styles.avatarText}>{entry.displayName[0]?.toUpperCase() ?? '?'}</Text>
        )}
      </View>

      {/* Name + role */}
      <View style={styles.nameCopy}>
        <Text style={[styles.name, isCurrentUser && styles.nameMe]} numberOfLines={1}>
          {entry.displayName}
          {isCurrentUser ? ' (you)' : ''}
        </Text>
        <Text style={styles.roleLabel}>{entry.role}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statCol}>
        <Text style={styles.ceuValue}>{entry.totalCeus.toFixed(1)}</Text>
        <Text style={styles.ceuLabel}>CEU</Text>
      </View>
      {entry.currentStreak > 0 && (
        <View style={styles.streakCol}>
          <Text style={styles.streakFlameSmall}>🔥</Text>
          <Text style={styles.streakNum}>{entry.currentStreak}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    content: {
      padding: 16,
      paddingBottom: 40,
      backgroundColor: colors.background,
    },
    myCard: {
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      backgroundColor: colors.primary,
    },
    myCardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    myAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.white, '22'),
    },
    myAvatarText: {
      fontSize: 18 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.white,
    },
    myAvatarImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    myInfo: { flex: 1 },
    myName: {
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.white,
      marginBottom: 4,
    },
    myStats: {
      flexDirection: 'row',
      gap: 6,
    },
    myStat: {
      fontSize: 13 * textScale,
      fontFamily: Typography.body,
      color: withAlpha(colors.white, 'CC'),
    },
    streakBadge: {
      alignItems: 'center',
      backgroundColor: withAlpha(colors.white, '20'),
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    streakFlame: {
      fontSize: 18,
      lineHeight: 22,
    },
    streakCount: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.white,
      textAlign: 'center',
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
      flexWrap: 'wrap',
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, '14'),
    },
    chipText: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.primary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
    },
    sectionCount: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primary,
    },
    loadingRow: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 32,
      gap: 10,
    },
    emptyTitle: {
      fontSize: 17 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
    },
    emptyText: {
      fontSize: 13 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 16,
      marginBottom: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowHighlighted: {
      borderColor: withAlpha(colors.primary, '44'),
      backgroundColor: withAlpha(colors.primary, '06'),
    },
    rowFirst: {
      borderColor: withAlpha(colors.accent, '44'),
      backgroundColor: withAlpha(colors.accent, '06'),
    },
    rankBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    rankNum: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '14'),
    },
    avatarMe: {
      backgroundColor: withAlpha(colors.primary, '22'),
    },
    avatarText: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primary,
    },
    avatarImage: {
      width: 38,
      height: 38,
      borderRadius: 19,
    },
    nameCopy: { flex: 1 },
    name: {
      fontSize: 14 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 2,
    },
    nameMe: { color: colors.primary },
    roleLabel: {
      fontSize: 11 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    statCol: { alignItems: 'flex-end' },
    ceuValue: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
    },
    ceuLabel: {
      fontSize: 10 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    streakCol: {
      alignItems: 'center',
      marginLeft: 4,
      minWidth: 28,
    },
    streakFlameSmall: {
      fontSize: 14,
      lineHeight: 18,
    },
    streakNum: {
      fontSize: 11 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.textSecondary,
    },
  });
