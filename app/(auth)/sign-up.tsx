import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Link, router } from 'expo-router';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { AppBrand } from '@/components/ui/AppBrand';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, getWebTransitionStyle, withAlpha } from '@/constants/theme';

export default function SignUp() {
  const { colors, textScale } = usePreferences();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const devAuthBypass = Boolean(Constants.expoConfig?.extra?.devAuthBypass);
  const styles = createStyles(colors, textScale);

  const handleSignUp = async () => {
    setFormError(null);

    if (devAuthBypass) {
      router.replace('/(auth)/onboarding');
      return;
    }

    if (!hasSupabaseEnv) {
      setFormError('Supabase is not configured. Add your project values to .env before creating an account.');
      return;
    }

    if (!fullName.trim() || !email.trim() || !password) {
      setFormError('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: 'hopecenterceu://',
      },
    });
    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    if (data.session) {
      setAccountCreated(true);
      setTimeout(() => router.replace('/(auth)/onboarding'), 700);
      return;
    }

    // Email confirmation is required — show inline instead of navigating away.
    setAwaitingConfirmation(true);
  };

  const handleSocialPress = async (provider: 'google' | 'apple') => {
    if (devAuthBypass) {
      router.replace('/(auth)/onboarding');
      return;
    }

    if (!hasSupabaseEnv) {
      Alert.alert('Supabase not configured', 'Add your project values to .env before using social sign up.');
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert(
        `${provider === 'google' ? 'Google' : 'Apple'} sign up`,
        'This screen is ready for social auth wiring. For now, continue with the main account flow while we finish the product.',
      );
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      Alert.alert('Sign up unavailable', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back to sign in"
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <AppBrand style={styles.brandLockup} />
          <View style={styles.logoOrb}>
            <Image source={require('@/assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Create your learning account</Text>
          <Text style={styles.subtitle}>
            Start with a calm setup, then move straight into your role track, CEU plan, or exam-prep path.
          </Text>
        </View>

        <Text style={styles.notice}>
          {devAuthBypass
            ? 'Builder mode is enabled locally. Creating an account will move you straight into onboarding while we keep shipping safely.'
            : !hasSupabaseEnv
              ? 'Local config missing. Add Supabase values to `.env` before testing signup.'
              : 'Create your account now, then choose your role to personalize the app.'}
        </Text>

        {Platform.OS === 'web' && (
          <>
            <View style={styles.socialGroup}>
              <SocialButton
                label="Continue with Google"
                icon={<Ionicons name="logo-google" size={18} color={colors.text} />}
                onPress={() => handleSocialPress('google')}
                styles={styles}
              />
              <SocialButton
                label="Continue with Apple"
                icon={<Ionicons name="logo-apple" size={20} color={colors.text} />}
                onPress={() => handleSocialPress('apple')}
                styles={styles}
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or create an account with email</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        )}

        {awaitingConfirmation ? (
          <View style={styles.confirmBox}>
            <Ionicons name="mail-open-outline" size={40} color={colors.primary} accessibilityElementsHidden />
            <Text style={styles.confirmTitle}>Check your inbox</Text>
            <Text style={styles.confirmBody}>
              We sent a confirmation link to <Text style={styles.confirmEmail}>{email}</Text>.
              Open it to activate your account, then come back to sign in.
            </Text>
            <Button
              title="Back to Sign In"
              onPress={() => router.replace('/(auth)/sign-in')}
              style={styles.button}
            />
          </View>
        ) : (
          <>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Doe"
              autoCapitalize="words"
              autoComplete="name"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="new-password"
            />

            {accountCreated ? (
              <View style={styles.successBanner} accessibilityRole="alert" accessibilityLiveRegion="polite">
                <Ionicons name="checkmark-circle" size={16} color={colors.success} accessibilityElementsHidden />
                <Text style={styles.successText}>Account created! Setting up your profile…</Text>
              </View>
            ) : formError ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} accessibilityElementsHidden />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <Button
              title={devAuthBypass ? 'Continue to Onboarding' : 'Create Account'}
              onPress={handleSignUp}
              loading={loading || accountCreated}
              style={styles.button}
            />

            <Link href="/(auth)/sign-in" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Already have an account? Sign in"
                style={styles.linkPressable}
              >
                <Text style={styles.footer}>
                  Already have an account? <Text style={styles.footerLink}>Sign in</Text>
                </Text>
              </Pressable>
            </Link>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({
  label,
  icon,
  onPress,
  styles,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <InteractivePressable
      style={styles.socialButton}
      hoverStyle={styles.socialButtonHover}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityHint="Continues account creation with a social account provider"
    >
      <View style={styles.socialIcon}>{icon}</View>
      <Text style={styles.socialText}>{label}</Text>
    </InteractivePressable>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 4,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandLockup: {
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  logoOrb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: withAlpha(colors.primary, '12'),
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, '88'),
  },
  logoImage: {
    width: 82,
    height: 82,
  },
  title: {
      fontSize: 30 * textScale,
      fontFamily: Typography.heading,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
    notice: {
    marginBottom: 18,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surface,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      fontFamily: Typography.body,
    },
  socialGroup: {
    gap: 10,
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 18,
  },
  socialButtonHover: {
    transform: [{ translateY: -1 }],
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  socialIcon: {
    width: 24,
    alignItems: 'center',
  },
  socialText: {
    fontSize: 15,
    fontFamily: Typography.bodySemiBold,
    color: colors.text,
    ...(getWebTransitionStyle('color') ?? {}),
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: Typography.bodyBold,
    letterSpacing: 0.4,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  button: {
    marginTop: 10,
    marginBottom: 24,
  },
  linkPressable: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: Typography.body,
  },
  footerLink: {
    color: colors.primary,
    fontFamily: Typography.bodyBold,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: withAlpha(colors.success, '12'),
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: withAlpha(colors.success, '30'),
  },
  successText: {
    fontSize: 13 * textScale,
    fontFamily: Typography.bodySemiBold,
    color: colors.success,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: withAlpha(colors.error, '14'),
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: withAlpha(colors.error, '30'),
  },
  errorText: {
    flex: 1,
    fontSize: 13 * textScale,
    fontFamily: Typography.body,
    color: colors.error,
    lineHeight: 18,
  },
  confirmBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  confirmTitle: {
    fontSize: 22 * textScale,
    fontFamily: Typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  confirmBody: {
    fontSize: 15 * textScale,
    fontFamily: Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  confirmEmail: {
    fontFamily: Typography.bodyBold,
    color: colors.text,
  },
});
