import { StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography } from '@/constants/theme';

export function SummaryRow({ label, value }: { label: string; value: string }) {
  const { colors, textScale } = usePreferences();
  const s = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    label: { fontSize: 13 * textScale, color: colors.textSecondary, fontFamily: Typography.body },
    value: { flexShrink: 1, fontSize: 13 * textScale, fontFamily: Typography.bodyBold, color: colors.text, textAlign: 'right' },
  });
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}
