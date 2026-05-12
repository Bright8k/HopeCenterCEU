import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { useAuth } from '@/context/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useCEUProgress } from '@/hooks/useCEUProgress';
import { useCertificates } from '@/hooks/useCertificates';
import { useProfile, formatRenewalDate } from '@/hooks/useProfile';
import { ROLE_CEU_REQUIREMENTS, ROLE_LABELS } from '@/constants/roles';
import { Typography, getWebTransitionStyle, withAlpha } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, role, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { colors, textScale, preferences } = usePreferences();
  const { progress, loading } = useCEUProgress();
  const { displayCertificates, usingPreviewData } = useCertificates();
  const { profile, refetch: refetchProfile } = useProfile();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const styles = createStyles(colors, textScale);

  useFocusEffect(
    useCallback(() => {
      refetchProfile();
    }, [refetchProfile]),
  );

  const fullName =
    profile?.display_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    'Hope Center Learner';
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

  async function downloadCertificate(completionId: string) {
    setDownloadingId(completionId);
    const { data, error } = await supabase.functions.invoke('issue-certificate', {
      body: { completionId },
    });
    setDownloadingId(null);

    if (error || !data?.signedUrl) {
      Alert.alert(
        'Download failed',
        'Unable to retrieve your certificate. Please try again shortly.',
        [{ text: 'OK' }],
      );
      return;
    }

    await Linking.openURL(data.signedUrl);
  }

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
          <Pressable
            onPress={() => router.push('/profile-edit')}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            style={styles.editBtn}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.white} />
          </Pressable>
        </View>
      </View>

      {/* Completion prompt — shown when renewal date is missing for professionals */}
      {hasSupabaseEnv && !isStudent && role && !profile?.renewal_date && (
        <Card style={styles.completionCard}>
          <View style={styles.completionRow}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.accent} accessibilityElementsHidden />
            <View style={styles.completionCopy}>
              <Text style={styles.completionTitle}>Add your renewal deadline</Text>
              <Text style={styles.completionText}>
                Set your CEU renewal date to track your pace and stay on schedule.
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/profile-edit')}
            accessibilityRole="button"
            accessibilityLabel="Set renewal date"
            style={({ pressed }) => [styles.completionBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.completionBtnText}>Set renewal date</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} accessibilityElementsHidden />
          </Pressable>
        </Card>
      )}

      <View style={styles.metricsRow}>
        <MetricCard
          label={isStudent ? 'Study Sets' : 'Completed'}
          value={loading ? '--' : String(completed)}
          icon="checkmark-done-outline"
          accent={colors.primary}
        />
        <MetricCard
          label={isStudent ? 'Track' : 'CEUs'}
          value={isStudent ? 'Exam' : loading ? '--' : earned.toFixed(1)}
          icon={isStudent ? 'school-outline' : 'ribbon-outline'}
          accent={colors.accentDark}
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
            value={
              isStudent
                ? 'BCBA exam preparation'
                : roleRequirement
                  ? `${roleRequirement.cycleYears} years`
                  : '--'
            }
          />
          <SummaryRow
            label={isStudent ? 'Current mode' : 'Required total'}
            value={
              isStudent ? 'Board prep' : roleRequirement ? `${roleRequirement.total} CEUs` : '--'
            }
          />
          {!isStudent && (
            <SummaryRow
              label="Renewal deadline"
              value={profile?.renewal_date ? formatRenewalDate(profile.renewal_date) : 'Not set'}
            />
          )}
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
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.recordCopy}>
            <Text style={styles.recordTitle}>Completion certificates</Text>
            <Text style={styles.recordText}>
              Certificates will appear here as you complete courses and pass assessments.
            </Text>
          </View>
        </View>
        <Badge
          label={(() => { const n = displayCertificates.filter((c) => c.passed).length; return n > 0 ? `${n} ready` : 'None yet'; })()}
          variant={displayCertificates.some((c) => c.passed) ? 'success' : 'muted'}
        />
      </Card>

      <View style={styles.certificateList}>
        {displayCertificates
          .filter((c) => c.passed)
          .map((certificate) => {
            const canDownload = hasSupabaseEnv && !usingPreviewData;
            const isDownloading = downloadingId === certificate.id;

            return (
              <Card key={certificate.id} style={styles.certificateCard}>
                <View style={styles.certificateHeader}>
                  <View style={styles.certificateIconWrap}>
                    <Ionicons name="document-attach-outline" size={18} color={colors.accentDark} />
                  </View>
                  <View style={styles.certificateCopy}>
                    <Text style={styles.certificateTitle}>{certificate.title}</Text>
                    <Text style={styles.certificateMeta}>
                      {formatDate(certificate.completedAt)} · {certificate.ceuValue} CEU
                    </Text>
                  </View>
                  {canDownload ? (
                    <Pressable
                      onPress={() => downloadCertificate(certificate.id)}
                      disabled={isDownloading}
                      accessibilityRole="button"
                      accessibilityLabel={`Download certificate for ${certificate.title}`}
                      accessibilityState={{ disabled: isDownloading }}
                      style={({ pressed }) => [
                        styles.certDownloadBtn,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Ionicons name="download-outline" size={20} color={colors.primary} />
                      )}
                    </Pressable>
                  ) : (
                    <Badge label="Preview" variant="muted" />
                  )}
                </View>
              </Card>
            );
          })}
      </View>

      <InteractivePressable
        onPress={() => router.push('/renewal-tracker')}
        style={styles.actionPressable}
        hoverStyle={!preferences.reducedMotion ? styles.hoverLift : undefined}
        accessibilityLabel="Open renewal tracker"
        accessibilityHint="View your CEU renewal deadline, pace, and completed course timeline"
      >
        {({ hovered }) => (
          <Card
            variant="elevated"
            style={[styles.recordCard, hovered && styles.actionCardHovered]}
          >
            <View style={styles.recordHeader}>
              <View style={styles.recordIconWrap}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.recordCopy}>
                <Text style={styles.recordTitle}>Renewal tracker</Text>
                <Text style={styles.recordText}>
                  Deadline countdown, pace indicator, and completed course timeline.
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={hovered ? colors.primary : colors.textSecondary}
              />
            </View>
          </Card>
        )}
      </InteractivePressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account actions</Text>
        <Text style={styles.sectionHint}>The basics you will use often.</Text>
      </View>

      <ActionCard
        icon="settings-outline"
        title="Open settings"
        description="Adjust dark mode, accessibility, audio behavior, reminders, and privacy preferences."
        onPress={() => router.push('/settings')}
      />

      <ActionCard
        icon="library-outline"
        title={isStudent ? 'Open study library' : 'Open CEU library'}
        description="Jump back into your catalog and continue building progress."
        onPress={() => router.push('/(tabs)/courses')}
      />

      <ActionCard
        icon="pulse-outline"
        title="Return to dashboard"
        description="Review your current pace, next steps, and encouragement at a glance."
        onPress={() => router.push('/(tabs)/index')}
      />

      {isAdmin && (
        <ActionCard
          icon="shield-checkmark-outline"
          title="Admin Portal"
          description="Manage courses, question banks, and published content for Hope Center."
          onPress={() => router.push('/(admin)/index')}
        />
      )}

      <Button title="Sign Out" onPress={handleSignOut} variant="outline" style={styles.signOutButton} />
    </ScrollView>
  );

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
        <View style={[styles.metricIconWrap, { backgroundColor: withAlpha(accent, '16') }]}>
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

  function ActionCard({
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
        style={styles.actionPressable}
        hoverStyle={!preferences.reducedMotion ? styles.hoverLift : undefined}
        accessibilityLabel={title}
        accessibilityHint={description}
      >
        {({ hovered }) => (
          <Card variant="elevated" style={[styles.actionCard, hovered && styles.actionCardHovered]}>
            <View style={[styles.actionIconWrap, hovered && styles.actionIconWrapHovered]}>
              <Ionicons name={icon} size={22} color={hovered ? colors.primaryLight : colors.primary} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={[styles.actionTitle, hovered && styles.actionTitleHovered]}>{title}</Text>
              <Text style={styles.actionDescription}>{description}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
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
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 36,
    },
    hero: {
      borderRadius: 24,
      padding: 20,
      marginBottom: 14,
      backgroundColor: colors.primary,
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
      backgroundColor: colors.accent,
    },
    avatarText: {
      fontSize: 26 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primaryDark,
    },
    heroCopy: {
      flex: 1,
    },
    name: {
      fontSize: 24 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.white,
      marginBottom: 4,
    },
    email: {
      fontSize: 14 * textScale,
      color: colors.white,
      marginBottom: 12,
      fontFamily: Typography.body,
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
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
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
      fontSize: 22 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 12 * textScale,
      color: colors.textSecondary,
      fontFamily: Typography.bodySemiBold,
    },
    summaryCard: {
      marginBottom: 18,
    },
    sectionEyebrow: {
      fontSize: 12 * textScale,
      fontFamily: Typography.bodyBold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 18 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 4,
    },
    sectionHeader: {
      marginBottom: 10,
    },
    sectionHint: {
      fontSize: 13 * textScale,
      color: colors.textSecondary,
      marginBottom: 10,
      fontFamily: Typography.body,
    },
    summaryText: {
      fontSize: 14 * textScale,
      lineHeight: 21,
      color: colors.textSecondary,
      marginBottom: 14,
      fontFamily: Typography.body,
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
      borderTopColor: colors.border,
    },
    summaryLabel: {
      fontSize: 13 * textScale,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    summaryValue: {
      flexShrink: 1,
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
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
      backgroundColor: withAlpha(colors.primary, '12'),
    },
    recordCopy: {
      flex: 1,
    },
    recordTitle: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 4,
    },
    recordText: {
      fontSize: 13 * textScale,
      lineHeight: 20,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    actionPressable: {
      marginBottom: 12,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    actionCardHovered: {
      borderColor: withAlpha(colors.primary, '44'),
      shadowColor: colors.primary,
      shadowOpacity: 0.18,
      shadowRadius: 18,
      backgroundColor: colors.card,
    },
    hoverLift: {
      transform: [{ translateY: -2 }],
    },
    actionIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '12'),
    },
    actionIconWrapHovered: {
      backgroundColor: withAlpha(colors.primary, '1A'),
    },
    actionCopy: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 4,
      ...(getWebTransitionStyle('color') ?? {}),
    },
    actionTitleHovered: {
      color: colors.primary,
    },
    actionDescription: {
      fontSize: 13 * textScale,
      lineHeight: 19,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    signOutButton: {
      marginTop: 6,
    },
    certificateList: {
      marginBottom: 12,
    },
    certificateCard: {
      marginBottom: 10,
    },
    certificateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    certificateIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.accent, '22'),
    },
    certificateCopy: {
      flex: 1,
    },
    certificateTitle: {
      fontSize: 14 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 2,
    },
    certificateMeta: {
      fontSize: 12 * textScale,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    certDownloadBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '12'),
    },
    editBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.white, '20'),
      alignSelf: 'flex-start',
    },
    completionCard: {
      marginBottom: 14,
      borderColor: withAlpha(colors.accent, '66'),
      borderWidth: 1,
    },
    completionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 12,
    },
    completionCopy: { flex: 1 },
    completionTitle: {
      fontSize: 14 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 3,
    },
    completionText: {
      fontSize: 13 * textScale,
      lineHeight: 19,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    completionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: withAlpha(colors.primary, '0E'),
    },
    completionBtnText: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primary,
    },
  });

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
