import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

type BadgeVariant = 'primary' | 'accent' | 'success' | 'muted';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: `${Colors.primary}18`, text: Colors.primary },
  accent: { bg: `${Colors.accent}22`, text: Colors.accentDark },
  success: { bg: '#388E3C18', text: '#2E7D32' },
  muted: { bg: Colors.border, text: Colors.textSecondary },
};

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const { bg, text } = VARIANT_STYLES[variant];
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
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
