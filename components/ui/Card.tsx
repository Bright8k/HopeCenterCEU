import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { getWebTransitionStyle } from '@/constants/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated';
};

export function Card({ children, style, variant = 'default' }: CardProps) {
  const { colors, resolvedTheme } = usePreferences();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          ...(getWebTransitionStyle() ?? {}),
        },
        variant === 'elevated' && [
          styles.elevated,
          {
            shadowColor: colors.shadow,
            shadowOpacity: resolvedTheme === 'light' ? 0.08 : 0.18,
            shadowRadius: resolvedTheme === 'light' ? 14 : 12,
            backgroundColor: resolvedTheme === 'light' ? colors.card : colors.card,
          },
        ],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  elevated: {
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
