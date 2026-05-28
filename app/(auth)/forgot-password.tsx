import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, withAlpha } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const { colors, textScale } = usePreferences();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(colors, textScale);

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!hasSupabaseEnv) {
      setError('Supabase is not configured. Add your project values to .env.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'hopecenterceu://reset-password' },
    );

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.successOrb}>
          <Ionicons name="mail-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.subtitle}>
          We sent a reset link to{' '}
          <Text style={styles.emailHighlight}>{email.trim().toLowerCase()}</Text>
          . Open the link on your device to set a new password.
        </Text>
        <Text style={styles.hint}>
          Didn&apos;t get it? Check your spam folder, or wait a minute before trying again.
        </Text>
        <Link href="/(auth)/sign-in" asChild>
          <Text style={styles.backLink}>Back to sign in</Text>
        </Link>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.iconWrap}>
          <Ionicons name="lock-open-outline" size={32} color={colors.primary} />
        </View>

        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>
          Enter your account email and we&apos;ll send you a link to reset your password.
        </Text>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Input
          label="Email"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Button
          title="Send reset link"
          onPress={handleSubmit}
          loading={loading}
          style={styles.button}
          accessibilityLabel="Send password reset link"
        />

        <Link href="/(auth)/sign-in" asChild>
          <Text style={styles.backLink}>Back to sign in</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      backgroundColor: withAlpha(colors.primary, '12'),
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, '22'),
    },
    successOrb: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      backgroundColor: withAlpha(colors.primary, '12'),
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, '30'),
    },
    title: {
      fontSize: 28 * textScale,
      fontFamily: Typography.heading,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 15 * textScale,
      lineHeight: 22,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    emailHighlight: {
      fontFamily: Typography.bodyBold,
      color: colors.text,
    },
    hint: {
      fontSize: 13 * textScale,
      lineHeight: 19,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 28,
    },
    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
      backgroundColor: withAlpha(colors.error, '10'),
      borderWidth: 1,
      borderColor: withAlpha(colors.error, '30'),
    },
    errorText: {
      flex: 1,
      fontSize: 13 * textScale,
      fontFamily: Typography.body,
      color: colors.error,
    },
    button: { marginTop: 10, marginBottom: 20 },
    backLink: {
      textAlign: 'center',
      color: colors.primary,
      fontSize: 14 * textScale,
      fontFamily: Typography.bodyBold,
    },
  });
