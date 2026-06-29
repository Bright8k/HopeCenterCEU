import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePreferences } from '@/context/PreferencesContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Typography, withAlpha } from '@/constants/theme';
import type { UserRole } from '@/constants/roles';
import { ROLE_LABELS } from '@/constants/roles';

const ROLES: UserRole[] = ['RBT', 'BCBA', 'STUDENT'];

export default function AdminInviteScreen() {
  const { colors, textScale } = usePreferences();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('RBT');
  const [sending, setSending] = useState(false);
  const styles = createStyles(colors, textScale);

  async function handleInvite() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (!hasSupabaseEnv) return;

    setSending(true);
    const { error } = await supabase.functions.invoke('invite-user', {
      body: {
        email: trimmed,
        role,
        displayName: displayName.trim() || undefined,
      },
    });
    setSending(false);

    if (error) {
      Alert.alert('Could not send invite', error.message ?? 'Please try again.');
      return;
    }

    Alert.alert(
      'Invitation sent',
      `${trimmed} will receive an email with a link to set up their account.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconWrap}>
          <Ionicons name="person-add-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.heading}>Invite a learner</Text>
        <Text style={styles.subheading}>
          They'll receive an email with a link to set their password and complete onboarding.
        </Text>

        <Card variant="elevated" style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email address *</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="learner@example.com"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              accessibilityLabel="Learner email address"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Display name (optional)</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Jane Smith"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              autoCorrect={false}
              accessibilityLabel="Learner display name"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => {
                const selected = r === role;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={({ pressed }) => [
                      styles.roleChip,
                      selected && styles.roleChipSelected,
                      pressed && { opacity: 0.75 },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={ROLE_LABELS[r]}
                  >
                    <Text style={[styles.roleChipText, selected && styles.roleChipTextSelected]}>
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.roleDesc}>{ROLE_LABELS[role]}</Text>
          </View>
        </Card>

        <Button
          title={sending ? 'Sending invite…' : 'Send invitation'}
          onPress={handleInvite}
          disabled={sending || !email.trim()}
          accessibilityLabel="Send learner invitation"
        />

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 48, gap: 16 },
    iconWrap: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: withAlpha(colors.primary, '14'),
      alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
    },
    heading: { fontSize: 26 * textScale, fontFamily: Typography.heading, color: colors.text, textAlign: 'center' },
    subheading: {
      fontSize: 14 * textScale, fontFamily: Typography.body,
      color: colors.textSecondary, textAlign: 'center', lineHeight: 22,
    },
    formCard: { gap: 18 },
    fieldGroup: { gap: 6 },
    fieldLabel: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15 * textScale, fontFamily: Typography.body, color: colors.text,
      backgroundColor: colors.surface,
    },
    roleRow: { flexDirection: 'row', gap: 8 },
    roleChip: {
      flex: 1, borderRadius: 12, paddingVertical: 10,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
      alignItems: 'center', justifyContent: 'center',
    },
    roleChipSelected: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, '12') },
    roleChipText: { fontSize: 13 * textScale, fontFamily: Typography.bodyBold, color: colors.textSecondary },
    roleChipTextSelected: { color: colors.primary },
    roleDesc: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    cancelBtn: { alignItems: 'center', paddingVertical: 14 },
    cancelText: { fontSize: 15 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
  });
