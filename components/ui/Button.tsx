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
import { Typography, getWebTransitionStyle } from '@/constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline';
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
  style,
  textStyle,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = usePreferences();
  const isPrimary = variant === 'primary';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? [styles.primary, { backgroundColor: colors.primary }, getWebTransitionStyle()]
          : [styles.outline, { borderColor: colors.primary, backgroundColor: colors.card }, getWebTransitionStyle()],
        isHovered && !disabled && !loading ? styles.hovered : null,
        pressed && !disabled && !loading ? styles.pressed : null,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary
              ? { color: colors.white }
              : { color: colors.primary },
            getWebTransitionStyle('color, transform'),
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
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primary: {
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  hovered: {
    transform: [{ translateY: -1 }],
  },
  pressed: {
    transform: [{ scale: 0.992 }],
  },
  text: {
    fontSize: 16,
    fontFamily: Typography.bodyBold,
  },
});
