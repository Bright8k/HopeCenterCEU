import { View, Text, StyleSheet } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, withAlpha } from '@/constants/theme';

type BadgeVariant = 'primary' | 'accent' | 'success' | 'muted';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const { colors } = usePreferences();
  const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
    primary: { bg: withAlpha(colors.primary, '18'), text: colors.primary },
    accent: { bg: withAlpha(colors.accent, '22'), text: colors.accentDark },
    success: { bg: withAlpha(colors.success, '18'), text: colors.success },
    muted: { bg: colors.surfaceMuted, text: colors.textSecondary },
  };
  const { bg, text } = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: Typography.bodyBold,
    letterSpacing: 0.4,
  },
});
