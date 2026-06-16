import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useProfile } from '@/hooks/useProfile';
import { scheduleRenewalReminders, cancelRenewalReminders } from '@/lib/notifications';
import { ROLE_LABELS, ROLE_CEU_REQUIREMENTS, type UserRole } from '@/constants/roles';
import { Typography, withAlpha } from '@/constants/theme';

const ROLES: UserRole[] = ['RBT', 'BCBA', 'STUDENT'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const RENEWAL_YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i);

export default function ProfileEditScreen() {
  const { user } = useAuth();
  const { colors, textScale, preferences } = usePreferences();
  const { profile, loading } = useProfile();
  const styles = createStyles(colors, textScale);

  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [renewalMonth, setRenewalMonth] = useState<number | null>(null);
  const [renewalYear, setRenewalYear] = useState<number | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pre-fill form once profile is loaded
  useEffect(() => {
    if (!profile) return;
    setDisplayName(
      profile.display_name ??
        (user?.user_metadata?.full_name as string | undefined) ??
        '',
    );
    setSelectedRole((profile.role as UserRole) ?? null);
    setAvatarUri(profile.avatar_url ?? null);
    if (profile.renewal_date) {
      const [year, month] = profile.renewal_date.split('-').map(Number);
      setRenewalYear(year);
      setRenewalMonth(month);
    }
  }, [profile, user]);

  async function pickAvatar() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow photo library access to change your avatar.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    if (!user || !hasSupabaseEnv) {
      setAvatarUri(asset.uri);
      return;
    }

    setUploadingAvatar(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const storagePath = `${user.id}/avatar.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: true });

      if (uploadErr) {
        Alert.alert('Upload failed', 'Unable to upload your photo. Please try again.');
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await (supabase.from('profiles') as any).update({ avatar_url: publicUrl }).eq('id', user.id);
      setAvatarUri(publicUrl);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!user) return;

    if (!displayName.trim()) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }

    if (!hasSupabaseEnv) {
      Alert.alert('Preview mode', 'Connect Supabase to save profile changes.');
      return;
    }

    const needsRenewal = selectedRole === 'RBT' || selectedRole === 'BCBA';
    if (needsRenewal && (!renewalMonth || !renewalYear)) {
      Alert.alert('Renewal date required', 'Please select your CEU renewal month and year.');
      return;
    }

    const renewalDate =
      needsRenewal && renewalMonth && renewalYear
        ? `${renewalYear}-${String(renewalMonth).padStart(2, '0')}-01`
        : null;

    setSaving(true);
    const { error } = await (supabase.from('profiles') as any).upsert({
      id: user.id,
      display_name: displayName.trim(),
      role: selectedRole,
      renewal_date: renewalDate,
    });
    setSaving(false);

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }

    // Sync notification schedule with the new renewal date
    if (preferences.pushReminders && renewalDate) {
      await scheduleRenewalReminders(renewalDate);
    } else if (!renewalDate) {
      await cancelRenewalReminders();
    }

    router.back();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: 'Edit Profile', headerShown: false }} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const needsRenewal = selectedRole === 'RBT' || selectedRole === 'BCBA';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable
            onPress={pickAvatar}
            disabled={uploadingAvatar}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            accessibilityHint="Opens your photo library to choose an avatar"
            style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.8 }]}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-outline" size={36} color={colors.primary} />
              </View>
            )}
            <View style={styles.avatarOverlay}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.white} />
              )}
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Display name */}
        <Text style={styles.sectionLabel}>Display name</Text>
        <Text style={styles.sectionHint}>Appears on your certificates.</Text>
        <Input
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Name as it appears on certificates"
          autoCapitalize="words"
          autoComplete="name"
        />

        {/* Role */}
        <Text style={styles.sectionLabel}>Learning track</Text>
        <Text style={styles.sectionHint}>Your track shapes your CEU library and progress targets.</Text>
        <View style={styles.roleList}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role;
            const req = ROLE_CEU_REQUIREMENTS[role];
            const isStudent = role === 'STUDENT';

            return (
              <InteractivePressable
                key={role}
                style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                hoverStyle={styles.roleCardHover}
                onPress={() => {
                  setSelectedRole(role);
                  if (role === 'STUDENT') {
                    setRenewalMonth(null);
                    setRenewalYear(null);
                  }
                }}
                accessibilityLabel={ROLE_LABELS[role]}
                accessibilityHint={`Select the ${role} track`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.roleRow}>
                  <View style={[styles.roleIcon, isSelected && styles.roleIconSelected]}>
                    <Ionicons
                      name={
                        isStudent
                          ? 'school-outline'
                          : role === 'BCBA'
                            ? 'ribbon-outline'
                            : 'medkit-outline'
                      }
                      size={18}
                      color={isSelected ? colors.white : colors.primary}
                    />
                  </View>
                  <View style={styles.roleCopy}>
                    <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>
                      {ROLE_LABELS[role]}
                    </Text>
                    <Text style={styles.roleMeta}>
                      {isStudent ? 'Board exam prep' : `${req.total} CEUs · ${req.cycleYears}-yr cycle`}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                      accessibilityElementsHidden
                    />
                  )}
                </View>
              </InteractivePressable>
            );
          })}
        </View>

        {/* Renewal date (RBT / BCBA only) */}
        {needsRenewal && (
          <View style={styles.renewalSection}>
            <Text style={styles.sectionLabel}>CEU renewal deadline</Text>
            <Text style={styles.sectionHint}>When does your current renewal cycle end?</Text>

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

      {/* Save footer */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            saving && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save profile changes"
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color={colors.white} accessibilityElementsHidden />
              <Text style={styles.saveBtnText}>Save changes</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    avatarSection: {
      alignItems: 'center',
      paddingVertical: 20,
      marginBottom: 8,
    },
    avatarWrap: {
      width: 90,
      height: 90,
      borderRadius: 45,
      position: 'relative',
    },
    avatarImage: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 2,
      borderColor: colors.border,
    },
    avatarPlaceholder: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '12'),
      borderWidth: 2,
      borderColor: colors.border,
    },
    avatarOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    avatarHint: {
      marginTop: 10,
      fontSize: 13,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    headerTitle: {
      flex: 1,
      fontSize: 17 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      textAlign: 'center',
    },
    headerRight: { width: 36 },
    content: { padding: 20, paddingBottom: 16 },
    sectionLabel: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 4,
      marginTop: 4,
    },
    sectionHint: {
      fontSize: 13 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      marginBottom: 14,
    },
    roleList: { gap: 10, marginBottom: 22 },
    roleCard: {
      borderRadius: 14,
      padding: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    roleCardSelected: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, '0C'),
    },
    roleCardHover: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    roleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    roleIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '10'),
    },
    roleIconSelected: { backgroundColor: colors.primary },
    roleCopy: { flex: 1 },
    roleTitle: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 2,
    },
    roleTitleSelected: { color: colors.primary },
    roleMeta: {
      fontSize: 12 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    renewalSection: { marginBottom: 8 },
    chipGroupLabel: {
      fontSize: 12 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.textSecondary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 18,
    },
    chip: {
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      minWidth: 50,
      alignItems: 'center',
    },
    chipWide: { minWidth: 70 },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, '10'),
    },
    chipText: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.primary,
      fontFamily: Typography.bodyBold,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 52,
      borderRadius: 14,
      backgroundColor: colors.primary,
    },
    saveBtnPressed: { opacity: 0.88 },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: {
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.white,
    },
  });
