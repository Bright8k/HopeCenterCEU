import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, withAlpha } from '@/constants/theme';

export function MetricCard({ label, value, icon, accent }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; accent: string }) {
  const { colors, textScale } = usePreferences();
  const s = StyleSheet.create({
    card: { flex: 1, borderRadius: 16, padding: 16, backgroundColor: colors.card, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, shadowOpacity: 0.06, elevation: 2 },
    iconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    value: { fontSize: 22 * textScale, fontFamily: Typography.bodyExtraBold, color: colors.text, marginBottom: 4 },
    label: { fontSize: 12 * textScale, color: colors.textSecondary, fontFamily: Typography.bodySemiBold },
  });
  return (
    <View style={s.card}>
      <View style={[s.iconWrap, { backgroundColor: withAlpha(accent, '16') }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={s.value}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}
