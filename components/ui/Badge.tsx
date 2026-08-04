import { View, Text, StyleSheet } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, withAlpha } from '@/constants/theme';

type BadgeVariant = 'primary' | 'accent' | 'success' | 'muted' | 'error' | 'warning';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
};

export function Badge({ label, variant = 'primary', size = 'sm' }: BadgeProps) {
  const { colors } = usePreferences();

  const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
    primary: { bg: withAlpha(colors.primary, '15'), text: colors.primary },
    accent:  { bg: withAlpha(colors.accent, '20'),  text: colors.accentDark },
    success: { bg: withAlpha(colors.success, '15'), text: colors.success },
    muted:   { bg: colors.surfaceMuted,              text: colors.textSecondary },
    error:   { bg: withAlpha(colors.error, '15'),   text: colors.error },
    warning: { bg: withAlpha(colors.warning, '20'), text: colors.warning },
  };

  const { bg, text } = variantStyles[variant];
  const isMd = size === 'md';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isMd && styles.md]}>
      <Text
        style={[
          styles.label,
          { color: text, fontSize: isMd ? 12 : 11 },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,       // pill — matches primary button shape language
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  label: {
    fontFamily: Typography.bodyBold,
    letterSpacing: 0.3,
  },
});
