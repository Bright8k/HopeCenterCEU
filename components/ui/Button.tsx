import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { useState } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, Shadow, getWebTransitionStyle } from '@/constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = usePreferences();
  const [isHovered, setIsHovered] = useState(false);
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 18, minHeight: 40 },
    md: { paddingVertical: 14, paddingHorizontal: 28, minHeight: 50 },
    lg: { paddingVertical: 17, paddingHorizontal: 36, minHeight: 56 },
  };

  const textSizes = { sm: 14, md: 15, lg: 16 };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variant === 'primary' && [
          styles.primary,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
          isHovered && !isDisabled && styles.primaryHovered,
          pressed && !isDisabled && styles.primaryPressed,
          ...(isHovered && !isDisabled ? [Shadow.md] : []),
        ],
        variant === 'outline' && [
          styles.outline,
          { borderColor: colors.primary, backgroundColor: colors.card },
          isHovered && !isDisabled && { backgroundColor: colors.surface },
          pressed && !isDisabled && { opacity: 0.85 },
        ],
        variant === 'ghost' && [
          styles.ghost,
          isHovered && !isDisabled && { backgroundColor: colors.surface },
          pressed && !isDisabled && { opacity: 0.75 },
        ],
        isDisabled && styles.disabled,
        { ...(getWebTransitionStyle('transform, box-shadow, background-color, opacity') ?? {}) },
        style,
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: textSizes[size], fontFamily: Typography.bodyBold },
            variant === 'primary' && { color: colors.white },
            variant === 'outline' && { color: colors.primary },
            variant === 'ghost' && { color: colors.textSecondary },
            { ...(getWebTransitionStyle('color') ?? {}) },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,       // pill shape — modern, confident CTA
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primary: {
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.25,
    elevation: 4,
  },
  primaryHovered: {
    transform: [{ translateY: -1 }],
  },
  primaryPressed: {
    transform: [{ scale: 0.978 }],
    shadowOpacity: 0.12,
  },
  outline: {
    borderWidth: 1.5,
    borderRadius: 12,        // outline buttons stay rectangular — visual contrast with pill CTA
  },
  ghost: {
    borderRadius: 10,
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    letterSpacing: 0.1,
  },
});
