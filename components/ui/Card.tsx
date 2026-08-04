import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { Shadow, getWebTransitionStyle } from '@/constants/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'ghost';
};

export function Card({ children, style, variant = 'default' }: CardProps) {
  const { colors, resolvedTheme } = usePreferences();
  const isDark = resolvedTheme === 'dark';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, shadowColor: colors.shadow },
        variant === 'default' && [
          styles.default,
          isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : { ...Shadow.sm },
        ],
        variant === 'elevated' && [
          styles.elevated,
          isDark
            ? { borderWidth: 1, borderColor: colors.border, ...Shadow.md, shadowOpacity: 0.4 }
            : { ...Shadow.lg },
        ],
        variant === 'ghost' && styles.ghost,
        { ...(getWebTransitionStyle('box-shadow, background-color, border-color') ?? {}) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
  },
  default: {},
  elevated: {},
  ghost: {
    backgroundColor: 'transparent',
  },
});
