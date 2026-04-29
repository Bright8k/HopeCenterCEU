import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { ROLE_LABELS, ROLE_CEU_REQUIREMENTS, type UserRole } from '@/constants/roles';
import type { Database } from '@/types/database';
import { Typography, getWebTransitionStyle, withAlpha } from '@/constants/theme';
import { InteractivePressable } from '@/components/ui/InteractivePressable';

const ROLES: UserRole[] = ['RBT', 'BCBA', 'STUDENT'];

export default function Onboarding() {
  const { user } = useAuth();
  const { colors, textScale } = usePreferences();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const devAuthBypass = Boolean(Constants.expoConfig?.extra?.devAuthBypass);
  const styles = createStyles(colors, textScale);

  const handleContinue = async () => {
    if (!selected) return;

    if (devAuthBypass || !user) {
      router.replace('/(tabs)');
      return;
    }

    if (!hasSupabaseEnv) {
      Alert.alert('Supabase not configured', 'Add your project values to .env before saving a role.');
      return;
    }

    setSaving(true);
    const update: Database['public']['Tables']['profiles']['Update'] = { role: selected };
    const { error } = await (supabase.from('profiles') as any).update(update).eq('id', user.id);
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <AppBrand style={styles.brandLockup} />
        <Text style={styles.title}>Choose your learning path</Text>
        <Text style={styles.subtitle}>
          Pick the role that best matches your current training track so the app can shape your dashboard, library, and progress plan around it.
        </Text>
      </View>

      <Text style={styles.notice}>
        {devAuthBypass
          ? 'Builder mode is enabled locally. Your role choice will shape the experience, then send you directly into the app.'
          : 'You can update your track later, but setting it now gives you the most useful experience from the start.'}
      </Text>

      {ROLES.map((role) => {
        const isSelected = selected === role;
        const requirement = ROLE_CEU_REQUIREMENTS[role];
        const isStudent = role === 'STUDENT';

        return (
          <InteractivePressable
            key={role}
            style={[styles.card, isSelected && styles.cardSelected]}
            hoverStyle={styles.cardHover}
            onPress={() => setSelected(role)}
            accessibilityLabel={ROLE_LABELS[role]}
            accessibilityHint={`Selects the ${role} learning track`}
            accessibilityState={{ selected: isSelected }}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardCopy}>
                <Text style={[styles.roleCode, isSelected && styles.roleCodeSelected]}>{role}</Text>
                <Text style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}>
                  {ROLE_LABELS[role]}
                </Text>
              </View>
              <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                <Ionicons
                  name={isStudent ? 'school-outline' : role === 'BCBA' ? 'ribbon-outline' : 'medkit-outline'}
                  size={20}
                  color={isSelected ? colors.white : colors.primary}
                />
              </View>
            </View>

            <Text style={[styles.roleDesc, isSelected && styles.roleDescSelected]}>
              {requirement.description}
            </Text>

            <View style={styles.cardMeta}>
              <MetaPill
                label={isStudent ? 'Board prep' : `${requirement.total} CEUs`}
                active={isSelected}
              />
              <MetaPill
                label={isStudent ? 'Student track' : `${requirement.cycleYears}-year cycle`}
                active={isSelected}
              />
            </View>
          </InteractivePressable>
        );
      })}

      <Pressable
        style={[styles.button, (!selected || saving) && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selected || saving}
      >
        {({ pressed }) =>
          saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[styles.buttonText, pressed && styles.buttonTextPressed]}>Continue</Text>
          )
        }
      </Pressable>
    </ScrollView>
  );
}

function MetaPill({ label, active }: { label: string; active: boolean }) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  return (
    <View style={[styles.metaPill, active && styles.metaPillActive]}>
      <Text style={[styles.metaPillText, active && styles.metaPillTextActive]}>{label}</Text>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 56,
    backgroundColor: colors.background,
  },
  hero: {
    marginBottom: 22,
  },
  brandLockup: {
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
    title: {
      fontSize: 30 * textScale,
      lineHeight: 36,
      fontFamily: Typography.heading,
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
    notice: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surface,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      fontFamily: Typography.body,
    },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: withAlpha(colors.primary, '12'),
  },
  cardHover: {
    transform: [{ translateY: -1 }],
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  cardCopy: {
    flex: 1,
  },
  roleCode: {
    fontSize: 11,
    fontFamily: Typography.bodyBold,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  roleCodeSelected: {
    color: colors.primary,
  },
  roleLabel: {
    fontSize: 18,
    fontFamily: Typography.bodyBold,
    color: colors.text,
  },
  roleLabelSelected: {
    color: colors.primary,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, '12'),
  },
  iconWrapSelected: {
    backgroundColor: colors.primary,
  },
  roleDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Typography.body,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  roleDescSelected: {
    color: colors.primaryLight,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceMuted,
  },
  metaPillActive: {
    backgroundColor: withAlpha(colors.accent, '2A'),
  },
  metaPillText: {
    fontSize: 12,
    fontFamily: Typography.bodyBold,
    color: colors.textSecondary,
  },
  metaPillTextActive: {
    color: colors.accentDark,
  },
  button: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Typography.bodyBold,
    color: colors.white,
    ...(getWebTransitionStyle('opacity') ?? {}),
  },
  buttonTextPressed: {
    opacity: 0.92,
  },
});
