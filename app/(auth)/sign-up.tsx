import { useState } from 'react';
import {
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!hasSupabaseEnv) {
      Alert.alert('Supabase not configured', 'Add your project values to .env before creating an account.');
      return;
    }

    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    if (data.session) {
      router.replace('/(auth)/onboarding');
      return;
    }

    Alert.alert('Check Your Email', 'Please confirm your email address to continue.', [
      { text: 'OK', onPress: () => router.replace('/(auth)/sign-in') },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>Hope Center CEU</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start earning your CEU credits today</Text>
        {!hasSupabaseEnv ? (
          <Text style={styles.notice}>
            Local config missing. Add Supabase values to .env to enable signup.
          </Text>
        ) : null}

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
          placeholder="Min. 8 characters"
          secureTextEntry
          autoComplete="new-password"
        />

        <Button
          title="Create Account"
          onPress={handleSignUp}
          loading={loading}
          style={styles.button}
        />

        <Link href="/(auth)/sign-in" asChild>
          <Text style={styles.footer}>
            Already have an account? <Text style={styles.footerLink}>Sign In</Text>
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
  notice: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 12,
    backgroundColor: Colors.surface,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
