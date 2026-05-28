import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { useAdminRole } from '@/hooks/useAdminRole';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Typography, withAlpha } from '@/constants/theme';

type Stats = { totalCourses: number; publishedCourses: number; totalQuestions: number };

export default function AdminOverview() {
  const { colors, textScale } = usePreferences();
  const { adminRole } = useAdminRole();
  const [stats, setStats] = useState<Stats | null>(null);
  const styles = createStyles(colors, textScale);

  useEffect(() => {
    if (!hasSupabaseEnv) return;
    Promise.all([
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('questions').select('*', { count: 'exact', head: true }),
    ]).then(([all, pub, q]) => {
      setStats({
        totalCourses: all.count ?? 0,
        publishedCourses: pub.count ?? 0,
        totalQuestions: q.count ?? 0,
      });
    });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.roleRow}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
        <Text style={styles.roleLabel}>{adminRole ?? 'admin'} access</Text>
      </View>

      <Text style={styles.heading}>Admin Portal</Text>
      <Text style={styles.subheading}>Manage courses and question content for Hope Center CEU.</Text>

      <View style={styles.statsRow}>
        <StatTile
          icon="book-outline"
          label="Courses"
          value={stats ? String(stats.totalCourses) : '--'}
          accent={colors.primary}
        />
        <StatTile
          icon="checkmark-circle-outline"
          label="Published"
          value={stats ? String(stats.publishedCourses) : '--'}
          accent={colors.success}
        />
        <StatTile
          icon="help-circle-outline"
          label="Questions"
          value={stats ? String(stats.totalQuestions) : '--'}
          accent={colors.accent}
        />
      </View>

      <Text style={styles.sectionTitle}>Quick actions</Text>

      <NavRow
        icon="book-outline"
        title="Manage Courses"
        description="Create, edit, publish, or archive course content."
        onPress={() => router.push('/(admin)/courses')}
      />
      <NavRow
        icon="help-circle-outline"
        title="Question Bank"
        description="Add or edit questions linked to courses."
        onPress={() => router.push('/(admin)/questions')}
      />
      <NavRow
        icon="bar-chart-outline"
        title="Analytics"
        description="Completion rates, pass rates, and learner activity."
        onPress={() => router.push('/(admin)/analytics')}
      />
    </ScrollView>
  );

  function StatTile({
    icon,
    label,
    value,
    accent,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    accent: string;
  }) {
    return (
      <View style={styles.statTile}>
        <View style={[styles.statIcon, { backgroundColor: withAlpha(accent, '20') }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    );
  }

  function NavRow({
    icon,
    title,
    description,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    onPress: () => void;
  }) {
    return (
      <InteractivePressable
        onPress={onPress}
        style={styles.navPressable}
        accessibilityLabel={title}
        accessibilityHint={description}
      >
        {({ hovered }) => (
          <Card
            variant="elevated"
            style={[styles.navCard, hovered && { borderColor: withAlpha(colors.primary, '44') }]}
          >
            <View style={[styles.navIconWrap, { backgroundColor: withAlpha(colors.primary, '12') }]}>
              <Ionicons name={icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.navCopy}>
              <Text style={[styles.navTitle, hovered && { color: colors.primary }]}>{title}</Text>
              <Text style={styles.navDesc}>{description}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={hovered ? colors.primary : colors.textSecondary}
            />
          </Card>
        )}
      </InteractivePressable>
    );
  }
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 36 },
    roleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
    roleLabel: {
      fontSize: 11 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    heading: { fontSize: 26 * textScale, fontFamily: Typography.heading, color: colors.text, marginBottom: 4 },
    subheading: {
      fontSize: 14 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    statTile: {
      flex: 1,
      borderRadius: 16,
      padding: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    statValue: { fontSize: 22 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text, marginBottom: 2 },
    statLabel: { fontSize: 11 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    sectionTitle: {
      fontSize: 16 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 10,
    },
    navPressable: { marginBottom: 12 },
    navCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    navIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    navCopy: { flex: 1 },
    navTitle: { fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginBottom: 2 },
    navDesc: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
  });
