import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, withAlpha } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const { colors, textScale } = usePreferences();
  // PKCE flow sends ?code=XXX&type=recovery as query params
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [sessionReady, setSessionReady] = useState(false);
  const [preparing, setPreparing] = useState(true);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const styles = createStyles(colors, textScale);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setPrepError('Supabase is not configured.');
      setPreparing(false);
      return;
    }

    async function exchangeToken(url: string | null) {
      if (!url) {
        setPrepError('No reset token found. Please request a new password reset link.');
        setPreparing(false);
        return;
      }

      // PKCE flow: query param ?code=XXX
      try {
        const parsed = new URL(url);
        const codeParam = parsed.searchParams.get('code') ?? (code ?? null);
        if (codeParam) {
          const { error } = await supabase.auth.exchangeCodeForSession(codeParam);
          if (error) throw error;
          setSessionReady(true);
          setPreparing(false);
          return;
        }
      } catch {
        // Fall through to hash-based parsing below
      }

      // Legacy hash flow: #access_token=XXX&refresh_token=YYY&type=recovery
      const hash = url.split('#')[1];
      if (hash) {
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');
        if (type === 'recovery' && access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            setPrepError('Invalid or expired reset link. Please request a new one.');
          } else {
            setSessionReady(true);
          }
          setPreparing(false);
          return;
        }
      }

      // If a PKCE code was passed via search params from Expo Router
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setPrepError('Invalid or expired reset link. Please request a new one.');
        } else {
          setSessionReady(true);
        }
        setPreparing(false);
        return;
      }

      setPrepError('No reset token found. Please request a new password reset link.');
      setPreparing(false);
    }

    Linking.getInitialURL().then(exchangeToken);
  }, [code]);

  async function handleSave() {
    if (password.length < 8) {
      setSaveError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setSaveError('Passwords do not match.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setSaveError(error.message);
      return;
    }

    // Sign out so the user starts a clean session with their new password
    await supabase.auth.signOut();
    setDone(true);
  }

  // ── Preparing (exchanging token) ────────────────────────────────────────────
  if (preparing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.preparingText}>Verifying your reset link…</Text>
      </View>
    );
  }

  // ── Token error ─────────────────────────────────────────────────────────────
  if (prepError) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
        </View>
        <Text style={styles.title}>Link expired</Text>
        <Text style={styles.subtitle}>{prepError}</Text>
        <Button
          title="Request a new link"
          onPress={() => router.replace('/(auth)/forgot-password')}
          style={styles.button}
        />
      </ScrollView>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.iconWrap, { backgroundColor: withAlpha(colors.success, '12'), borderColor: withAlpha(colors.success, '30') }]}>
          <Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />
        </View>
        <Text style={styles.title}>Password updated</Text>
        <Text style={styles.subtitle}>
          Your password has been changed. Sign in with your new credentials.
        </Text>
        <Button
          title="Sign in"
          onPress={() => router.replace('/(auth)/sign-in')}
          style={styles.button}
        />
      </ScrollView>
    );
  }

  // ── New password form ────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.subtitle}>Choose a strong password that you don&apos;t use elsewhere.</Text>

        {saveError && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        )}

        <Input
          label="New password"
          value={password}
          onChangeText={(t) => { setPassword(t); setSaveError(null); }}
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          value={confirm}
          onChangeText={(t) => { setConfirm(t); setSaveError(null); }}
          placeholder="Repeat your new password"
          secureTextEntry
          autoComplete="new-password"
        />

        <Button
          title="Update password"
          onPress={handleSave}
          loading={saving}
          style={styles.button}
          accessibilityLabel="Save new password"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
    preparingText: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    container: {
      flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background,
    },
    iconWrap: {
      width: 72, height: 72, borderRadius: 36, alignSelf: 'center',
      alignItems: 'center', justifyContent: 'center', marginBottom: 20,
      backgroundColor: withAlpha(colors.primary, '12'),
      borderWidth: 1, borderColor: withAlpha(colors.primary, '22'),
    },
    title: {
      fontSize: 28 * textScale, fontFamily: Typography.heading, color: colors.text,
      textAlign: 'center', marginBottom: 10,
    },
    subtitle: {
      fontSize: 15 * textScale, lineHeight: 22, fontFamily: Typography.body,
      color: colors.textSecondary, textAlign: 'center', marginBottom: 24,
    },
    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12,
      padding: 12, marginBottom: 14,
      backgroundColor: withAlpha(colors.error, '10'),
      borderWidth: 1, borderColor: withAlpha(colors.error, '30'),
    },
    errorText: { flex: 1, fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.error },
    button: { marginTop: 10 },
  });
