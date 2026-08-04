import { View, Text, StyleSheet } from 'react-native';
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
  const { colors } = usePreferences();
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const fillColor = color ?? colors.primary;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      accessibilityLabel={accessibilityLabel ?? `${Math.round(pct)}% complete`}
    >
      <View
        style={[
          styles.track,
          { height, backgroundColor: withAlpha(fillColor, '18') },
        ]}
      >
        <View
          style={[
            styles.fill,
            { width: `${pct}%` as const, backgroundColor: fillColor, height },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {value} / {max} · {Math.round(pct)}%
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
