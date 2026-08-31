import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, withAlpha } from '@/constants/theme';

type ProgressBarProps = {
  value: number;
  max: number;
  showLabel?: boolean;
  color?: string;
  height?: number;
  accessibilityLabel?: string;
};

export function ProgressBar({
  value,
  max,
  showLabel = false,
  color,
  height = 8,
  accessibilityLabel,
}: ProgressBarProps) {
  const { colors, preferences } = usePreferences();
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const fillColor = color ?? colors.primary;
  const [trackWidth, setTrackWidth] = useState(0);
  const animWidth = useSharedValue(0);
  const reducedMotion = preferences.reducedMotion;

  useEffect(() => {
    if (trackWidth <= 0) return;
    animWidth.value = withTiming(trackWidth * pct, {
      duration: reducedMotion ? 0 : 600,
      easing: Easing.out(Easing.cubic),
    });
  // animWidth is a ref-like stable object, intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, trackWidth, reducedMotion]);

  const fillStyle = useAnimatedStyle(() => ({ width: animWidth.value }));

  function handleLayout(e: LayoutChangeEvent) {
    setTrackWidth(e.nativeEvent.layout.width);
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      accessibilityLabel={accessibilityLabel ?? `${Math.round(pct * 100)}% complete`}
    >
      <View
        style={[styles.track, { height, backgroundColor: withAlpha(fillColor, '18') }]}
        onLayout={handleLayout}
      >
        <Animated.View style={[styles.fill, { backgroundColor: fillColor, height }, fillStyle]} />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {value} / {max} · {Math.round(pct * 100)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: Typography.bodySemiBold,
    letterSpacing: 0.2,
  },
});
