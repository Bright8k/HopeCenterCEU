import { View, Text, StyleSheet } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';

type ProgressBarProps = {
  value: number;
  max: number;
  showLabel?: boolean;
  color?: string;
  height?: number;
};

export function ProgressBar({
  value,
  max,
  showLabel = false,
  color,
  height = 10,
}: ProgressBarProps) {
  const { colors } = usePreferences();
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const fillColor = color ?? colors.primary;

  return (
    <View>
      <View style={[styles.track, { height, backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%` as const, backgroundColor: fillColor, height },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {value} / {max} ({Math.round(pct)}%)
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
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});
