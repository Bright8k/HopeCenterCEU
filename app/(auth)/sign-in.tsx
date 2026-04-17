import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Link, router } from 'expo-router';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const devAuthBypass = Boolean(Constants.expoConfig?.extra?.devAuthBypass);

  const goToDashboard = () => {
    router.replace('/(tabs)');
  };

  const handleSignIn = async () => {
    if (devAuthBypass) {
      goToDashboard();
      return;
    }

    if (!hasSupabaseEnv) {
      Alert.alert('Supabase not configured', 'Add your project values to .env before signing in.');
      return;
    }

    if (!email || !password) {
      Alert.alert('Missing details', 'Enter your email and password to sign in.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }

    goToDashboard();
  };

  const handleSocialPress = async (provider: 'google' | 'apple') => {
    if (devAuthBypass) {
      goToDashboard();
      return;
    }

    if (!hasSupabaseEnv) {
      Alert.alert('Supabase not configured', 'Add your project values to .env before using social sign in.');
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert(
        `${provider === 'google' ? 'Google' : 'Apple'} sign in`,
        'This button is ready for social auth wiring. For now, use the main sign in button to continue to the dashboard while we build screens.',
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
      Alert.alert('Sign in unavailable', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoOrb}>
            <Image source={require('@/assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.brand}>Hope Center CEU</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Training for ABA professionals with the Hope Center for Behavior Change color direction and feel.
          </Text>
        </View>

        {devAuthBypass ? (
          <Text style={styles.notice}>
            Builder mode is enabled locally. Sign in actions currently route straight to the dashboard so we can keep developing screens safely.
          </Text>
        ) : !hasSupabaseEnv ? (
          <Text style={styles.notice}>
            Local config missing. Add Supabase values to `.env` before testing auth.
          </Text>
        ) : (
          <Text style={styles.notice}>
            Use your real credentials here. This login screen is now wired to keep dev bypass separate from production behavior.
          </Text>
        )}

        <View style={styles.socialGroup}>
          <SocialButton
            label="Continue with Google"
            icon={<Ionicons name="logo-google" size={18} color={Colors.text} />}
            onPress={() => handleSocialPress('google')}
          />
          <SocialButton
            label="Continue with Apple"
            icon={<Ionicons name="logo-apple" size={20} color={Colors.text} />}
            onPress={() => handleSocialPress('apple')}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign in with email</Text>
          <View style={styles.dividerLine} />
        </View>

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
          placeholder="Password"
          secureTextEntry
          autoComplete="password"
        />

        <Button title={devAuthBypass ? 'Enter Dashboard' : 'Sign In'} onPress={handleSignIn} loading={loading} style={styles.button} />

        <Link href="/(auth)/sign-up" asChild>
          <Text style={styles.footer}>
            Don&apos;t have an account yet? <Text style={styles.footerLink}>Create one</Text>
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SocialButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.socialButton} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.socialIcon}>{icon}</View>
      <Text style={styles.socialText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoOrb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: `${Colors.primary}12`,
    borderWidth: 1,
    borderColor: `${Colors.accent}88`,
  },
  logoImage: {
    width: 82,
    height: 82,
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  notice: {
    marginBottom: 18,
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.surface,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
  },
  socialIcon: {
    width: 24,
    alignItems: 'center',
  },
  socialText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
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
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  button: {
    marginTop: 10,
    marginBottom: 24,
    backgroundColor: Colors.primary,
  },
  footer: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
