import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  type AccessibilityState,
  type AccessibilityRole,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { getWebTransitionStyle } from '@/constants/theme';

type InteractivePressableProps = {
  children:
    | React.ReactNode
    | ((state: { hovered: boolean; pressed: boolean }) => React.ReactNode);
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
};

export function InteractivePressable({
  children,
  onPress,
  style,
  hoverStyle,
  pressedStyle,
  disabled = false,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: InteractivePressableProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { preferences } = usePreferences();

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        getWebTransitionStyle(),
        style,
        isHovered && hoverStyle,
        pressed && !preferences.reducedMotion ? [styles.pressed, pressedStyle] : pressedStyle,
      ]}
    >
      {({ pressed }) =>
        typeof children === 'function'
          ? children({ hovered: isHovered, pressed })
          : children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: 0.992 }],
  },
});
