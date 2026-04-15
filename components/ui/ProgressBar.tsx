import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

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
  color = Colors.primary,
  height = 10,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <View>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%` as any, backgroundColor: color, height },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>
          {value} / {max} ({Math.round(pct)}%)
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
