import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Typography, withAlpha } from '@/constants/theme';

interface CertData {
  courseTitle: string;
  ceuValue: number;
  completedAt: string;
  certUrl: string | null;
  passed: boolean;
}

function formatCertDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function CertificateScreen() {
  const { completionId } = useLocalSearchParams<{ completionId: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);

  const [certData, setCertData] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fullName =
    profile?.display_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    'Learner';

  useEffect(() => {
    if (!completionId || !hasSupabaseEnv || !user) {
      setCertData({
        courseTitle: 'Ethics in Supervision Decisions',
        ceuValue: 2,
        completedAt: new Date().toISOString(),
        certUrl: null,
        passed: true,
      });
      setLoading(false);
      return;
    }

    let active = true;
    (supabase as any)
      .from('completions')
      .select('passed, cert_url, completed_at, courses(title, ceu_value)')
      .eq('id', completionId)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }: { data: any; error: any }) => {
        if (!active) return;
        if (data && !error) {
          setCertData({
            courseTitle: data.courses?.title ?? 'Course',
            ceuValue: data.courses?.ceu_value ?? 0,
            completedAt: data.completed_at,
            certUrl: data.cert_url ?? null,
            passed: Boolean(data.passed),
          });
        }
        setLoading(false);
      });

    return () => { active = false; };
  }, [completionId, user?.id]);

  async function handleDownload() {
    if (!hasSupabaseEnv) {
      Alert.alert('Preview mode', 'Connect Supabase to generate and download certificates.');
      return;
    }
    setDownloading(true);
    const { data, error } = await supabase.functions.invoke('issue-certificate', {
      body: { completionId },
    });
    setDownloading(false);
    if (error || !data?.signedUrl) {
      Alert.alert('Download failed', 'Unable to retrieve your certificate. Please try again shortly.');
      return;
    }
    await Linking.openURL(data.signedUrl);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Certificate</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !certData ? (
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>Certificate not found.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Certificate card ── */}
          <View style={styles.certCard}>
            {/* Top accent bar */}
            <View style={styles.accentBar} />

            {/* Seal */}
            <View style={styles.sealWrap}>
              <View style={styles.sealOuter}>
                <View style={styles.sealInner}>
                  <Text style={styles.sealInitials}>HC</Text>
                </View>
              </View>
            </View>

            {/* Org name */}
            <Text style={styles.orgName}>Hope Center for Behavior Change</Text>

            {/* Certificate title */}
            <Text style={styles.certTitle}>Certificate of Completion</Text>

            <View style={styles.divider} />

            <Text style={styles.certPhrase}>This certifies that</Text>

            {/* Recipient name */}
            <Text style={styles.recipientName}>{fullName}</Text>

            <Text style={styles.certPhrase}>has successfully completed</Text>

            {/* Course name */}
            <Text style={styles.courseTitle}>{certData.courseTitle}</Text>

            {/* Date + CEU row */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textSecondary}
                  accessibilityElementsHidden
                />
                <Text style={styles.metaText}>{formatCertDate(certData.completedAt)}</Text>
              </View>
              {certData.ceuValue > 0 && (
                <View style={[styles.metaItem, styles.ceuBadge]}>
                  <Ionicons
                    name="ribbon-outline"
                    size={14}
                    color={colors.primary}
                    accessibilityElementsHidden
                  />
                  <Text style={styles.ceuText}>
                    {certData.ceuValue} CEU{certData.ceuValue !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Credential line */}
            <Text style={styles.credentialLine}>
              Authorized Continuing Education Provider · BACB ACE Program
            </Text>

            {/* Bottom accent bar */}
            <View style={styles.accentBarBottom} />
          </View>

          {/* ── Download button ── */}
          <Pressable
            onPress={handleDownload}
            disabled={downloading}
            accessibilityRole="button"
            accessibilityLabel="Download certificate PDF"
            accessibilityState={{ disabled: downloading }}
            style={({ pressed }) => [styles.downloadBtn, pressed && { opacity: 0.8 }]}
          >
            {downloading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color={colors.white} />
                <Text style={styles.downloadBtnText}>Download PDF</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.footerNote}>
            The PDF version of your certificate is suitable for professional submission and
            continuing education records.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
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
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      textAlign: 'center',
    },
    headerRight: { width: 36 },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
    },
    errorText: {
      fontSize: 15 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
      alignItems: 'center',
    },

    // ── Certificate card ──────────────────────────────────────────────────────
    certCard: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      overflow: 'hidden',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    accentBar: {
      width: '100%',
      height: 6,
      backgroundColor: colors.primary,
    },
    accentBarBottom: {
      width: '100%',
      height: 4,
      backgroundColor: withAlpha(colors.primary, '50'),
      marginTop: 20,
    },
    sealWrap: {
      marginTop: 28,
      marginBottom: 14,
    },
    sealOuter: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: withAlpha(colors.primary, '12'),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: withAlpha(colors.primary, '30'),
    },
    sealInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sealInitials: {
      fontSize: 20 * textScale,
      fontFamily: Typography.heading,
      color: colors.white,
      letterSpacing: 1,
    },
    orgName: {
      fontSize: 11 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      textAlign: 'center',
      paddingHorizontal: 24,
      marginBottom: 6,
    },
    certTitle: {
      fontSize: 24 * textScale,
      fontFamily: Typography.heading,
      color: colors.primary,
      textAlign: 'center',
      letterSpacing: 0.5,
      marginBottom: 14,
      paddingHorizontal: 20,
    },
    divider: {
      width: '60%',
      height: 1,
      backgroundColor: withAlpha(colors.primary, '25'),
      marginVertical: 16,
    },
    certPhrase: {
      fontSize: 13 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    recipientName: {
      fontSize: 26 * textScale,
      fontFamily: Typography.heading,
      color: colors.text,
      textAlign: 'center',
      paddingHorizontal: 24,
      marginBottom: 12,
      lineHeight: 34,
    },
    courseTitle: {
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      textAlign: 'center',
      paddingHorizontal: 24,
      marginTop: 6,
      lineHeight: 24,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 18,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      fontSize: 13 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    ceuBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: withAlpha(colors.primary, '10'),
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, '25'),
    },
    ceuText: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.primary,
    },
    credentialLine: {
      fontSize: 10 * textScale,
      fontFamily: Typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 24,
      letterSpacing: 0.3,
    },

    // ── Download button ───────────────────────────────────────────────────────
    downloadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 32,
      width: '100%',
      maxWidth: 480,
      minHeight: 52,
    },
    downloadBtnText: {
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.white,
    },
    footerNote: {
      fontSize: 12 * textScale,
      fontFamily: Typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 14,
      paddingHorizontal: 12,
      lineHeight: 18,
    },
  });
