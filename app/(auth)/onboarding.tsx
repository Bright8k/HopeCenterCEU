import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { AppBrand } from '@/components/ui/AppBrand';
import { RoleStep } from '@/components/onboarding/RoleStep';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { type UserRole } from '@/constants/roles';
import { Typography, getWebTransitionStyle, withAlpha } from '@/constants/theme';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const RENEWAL_YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i);
const TOTAL_STEPS = 3;

export default function Onboarding() {
  const { user, refetchRole } = useAuth();
  const { colors, textScale } = usePreferences();
  const devAuthBypass = __DEV__ && Boolean(Constants.expoConfig?.extra?.devAuthBypass);
  const styles = createStyles(colors, textScale);

  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState<string>(
    (user?.user_metadata?.full_name as string | undefined) ?? '',
  );
  const [renewalMonth, setRenewalMonth] = useState<number | null>(null);
  const [renewalYear, setRenewalYear] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  function transition(toStep: number) {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -12, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setStep(toStep);
      slideAnim.setValue(12);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }

  async function handleFinish() {
    if (devAuthBypass) {
      router.replace('/(tabs)');
      return;
    }

    if (!hasSupabaseEnv) {
      Alert.alert('Supabase not configured', 'Add your project values to .env before saving your profile.');
      return;
    }

    const needsRenewal = selectedRole === 'RBT' || selectedRole === 'BCBA';
    if (needsRenewal && (!renewalMonth || !renewalYear)) {
      Alert.alert('Renewal date required', 'Please select your CEU renewal month and year.');
      return;
    }

    setSaving(true);

    // Fetch the current user directly in case the auth context hasn't settled yet
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setSaving(false);
      Alert.alert('Session expired', 'Please sign in again.');
      router.replace('/(auth)/sign-in');
      return;
    }

    const name = displayName.trim() || (currentUser.user_metadata?.full_name as string | undefined) || 'Learner';
    const renewalDate =
      needsRenewal && renewalMonth && renewalYear
        ? `${renewalYear}-${String(renewalMonth).padStart(2, '0')}-01`
        : null;

    const { error } = await supabase.from('profiles').upsert({
      id: currentUser.id,
      display_name: name,
      role: selectedRole,
      renewal_date: renewalDate,
    });
    setSaving(false);

    if (error) {
      Alert.alert('Error saving profile', error.message);
      return;
    }

    // Refresh the role in AuthContext so the profile tab reflects the change immediately
    await refetchRole();
    router.replace('/(tabs)');
  }

  const canProceedStep1 = selectedRole !== null;
  const canFinish = displayName.trim().length > 0;
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Progress dots */}
      <View style={styles.progressRow} accessibilityLabel={`Step ${step + 1} of ${TOTAL_STEPS}`}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
            accessibilityElementsHidden
          />
        ))}
      </View>

      {/* Animated step content */}
      <Animated.View
        style={[
          styles.animatedContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* ── Step 0: Welcome ─────────────────────────────────────────── */}
        {step === 0 && (
          <ScrollView
            contentContainerStyle={styles.stepContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.welcomeWrap}>
              <AppBrand style={styles.brandLarge} />
              <View style={styles.welcomeOrb}>
                <Ionicons name="ribbon-outline" size={44} color={colors.accent} />
              </View>
              <Text style={styles.welcomeTitle}>Your CEU journey{'\n'}starts here</Text>
              <Text style={styles.welcomeSubtitle}>
                Hope Center CEU helps behavior professionals complete accredited coursework, track renewal progress, and earn certificates — from anywhere.
              </Text>
              <View style={styles.featureList}>
                <FeatureRow icon="book-outline" label="Accredited CEU courses for RBTs and BCBAs" />
                <FeatureRow icon="ribbon-outline" label="Instant branded PDF certificates" />
                <FeatureRow icon="trending-up-outline" label="CEU renewal deadline tracker" />
                <FeatureRow icon="school-outline" label="BCBA exam prep for student analysts" />
              </View>
            </View>
          </ScrollView>
        )}

        {/* ── Step 1: Role ─────────────────────────────────────────────── */}
        {step === 1 && <RoleStep selectedRole={selectedRole} onSelect={setSelectedRole} />}

        {/* ── Step 2: Profile setup ─────────────────────────────────────── */}
        {step === 2 && (
          <ScrollView
            contentContainerStyle={styles.stepContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepEyebrow}>Step 2 of 2</Text>
            <Text style={styles.stepTitle}>Set up your profile</Text>
            <Text style={styles.stepSubtitle}>
              {selectedRole !== 'STUDENT'
                ? 'Your display name appears on certificates. Adding your renewal date lets us track your deadline and pace.'
                : 'Your display name will appear on any certificates you earn.'}
            </Text>

            <Input
              label="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Name as it appears on certificates"
              autoCapitalize="words"
              autoComplete="name"
            />

            {(selectedRole === 'RBT' || selectedRole === 'BCBA') && (
              <View style={styles.renewalSection}>
                <Text style={styles.renewalTitle}>CEU renewal deadline</Text>
                <Text style={styles.renewalHint}>When does your current renewal cycle end?</Text>

                <Text style={styles.chipGroupLabel}>Month</Text>
                <View style={styles.chipGrid}>
                  {MONTHS.map((month, i) => {
                    const monthNum = i + 1;
                    const active = renewalMonth === monthNum;
                    return (
                      <Pressable
                        key={month}
                        onPress={() => setRenewalMonth(monthNum)}
                        accessibilityRole="button"
                        accessibilityLabel={month}
                        accessibilityState={{ selected: active }}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {month}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.chipGroupLabel}>Year</Text>
                <View style={styles.chipGrid}>
                  {RENEWAL_YEARS.map((year) => {
                    const active = renewalYear === year;
                    return (
                      <Pressable
                        key={year}
                        onPress={() => setRenewalYear(year)}
                        accessibilityRole="button"
                        accessibilityLabel={String(year)}
                        accessibilityState={{ selected: active }}
                        style={[styles.chip, styles.chipWide, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {year}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </Animated.View>

      {/* ── Footer nav ──────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        {step > 0 ? (
          <Pressable
            onPress={() => transition(step - 1)}
            accessibilityRole="button"
            accessibilityLabel="Go to previous step"
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        ) : (
          <View style={styles.footerSpacer} />
        )}

        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            ((step === 1 && !canProceedStep1) || (isLastStep && !canFinish)) &&
              styles.nextBtnDisabled,
            pressed && styles.nextBtnPressed,
          ]}
          onPress={isLastStep ? handleFinish : () => transition(step + 1)}
          disabled={(step === 1 && !canProceedStep1) || (isLastStep && !canFinish) || saving}
          accessibilityRole="button"
          accessibilityLabel={
            isLastStep ? 'Finish setup and go to dashboard' : 'Continue to next step'
          }
          accessibilityState={{
            disabled: (step === 1 && !canProceedStep1) || (isLastStep && !canFinish),
          }}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.nextBtnText}>
                {step === 0 ? 'Get started' : isLastStep ? 'Go to dashboard' : 'Continue'}
              </Text>
              <Ionicons
                name={isLastStep ? 'checkmark' : 'arrow-forward'}
                size={18}
                color={colors.white}
              />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );

  function FeatureRow({
    icon,
    label,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }) {
    return (
      <View style={styles.featureRow}>
        <View style={styles.featureIcon}>
          <Ionicons name={icon} size={18} color={colors.primary} accessibilityElementsHidden />
        </View>
        <Text style={styles.featureLabel}>{label}</Text>
      </View>
    );
  }

}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16, paddingBottom: 10 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { width: 24, borderRadius: 4, backgroundColor: colors.primary },
    dotDone: { backgroundColor: withAlpha(colors.primary, '60') },
    animatedContent: { flex: 1 },
    stepContainer: { padding: 24, paddingBottom: 16 },
    welcomeWrap: { alignItems: 'center', paddingTop: 12 },
    brandLarge: { alignSelf: 'center', marginBottom: 28 },
    welcomeOrb: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(colors.primary, '12'), borderWidth: 1.5, borderColor: withAlpha(colors.accent, '66'), marginBottom: 28 },
    welcomeTitle: { fontSize: 32 * textScale, lineHeight: 40, fontFamily: Typography.heading, color: colors.text, textAlign: 'center', marginBottom: 14 },
    welcomeSubtitle: { fontSize: 15 * textScale, lineHeight: 23, fontFamily: Typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 28, maxWidth: 320 },
    featureList: { width: '100%', gap: 14 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(colors.primary, '10') },
    featureLabel: { flex: 1, fontSize: 14 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text },
    stepEyebrow: { fontSize: 12 * textScale, fontFamily: Typography.bodyBold, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.primary, marginBottom: 8 },
    stepTitle: { fontSize: 28 * textScale, lineHeight: 35, fontFamily: Typography.heading, color: colors.text, marginBottom: 10 },
    stepSubtitle: { fontSize: 14 * textScale, lineHeight: 21, fontFamily: Typography.body, color: colors.textSecondary, marginBottom: 22 },
    renewalSection: { marginTop: 6, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    renewalTitle: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginBottom: 4 },
    renewalHint: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary, marginBottom: 16 },
    chipGroupLabel: { fontSize: 12 * textScale, fontFamily: Typography.bodyBold, color: colors.textSecondary, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
    chip: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, minWidth: 50, alignItems: 'center' },
    chipWide: { minWidth: 70 },
    chipActive: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, '12') },
    chipText: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    chipTextActive: { color: colors.primary, fontFamily: Typography.bodyBold },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
    footerSpacer: { flex: 1 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 4 },
    backBtnText: { fontSize: 15 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text, ...(getWebTransitionStyle('color') ?? {}) },
    nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, borderRadius: 14, backgroundColor: colors.primary },
    nextBtnDisabled: { opacity: 0.45 },
    nextBtnPressed: { opacity: 0.88 },
    nextBtnText: { fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.white, ...(getWebTransitionStyle('opacity') ?? {}) },
  });
