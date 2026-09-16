import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { Card } from '@/components/ui/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, withAlpha, getWebTransitionStyle } from '@/constants/theme';

export function ActionCard({ icon, title, description, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; onPress: () => void }) {
  const { colors, textScale, preferences } = usePreferences();
  const s = StyleSheet.create({
    pressable: { marginBottom: 12 },
    lift: { transform: [{ translateY: -2 }] },
    card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardHovered: { borderColor: withAlpha(colors.primary, '44'), shadowColor: colors.primary, shadowOpacity: 0.18, shadowRadius: 18, backgroundColor: colors.card },
    iconWrap: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(colors.primary, '12') },
    iconWrapHovered: { backgroundColor: withAlpha(colors.primary, '1A') },
    copy: { flex: 1 },
    title: { fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginBottom: 4, ...(getWebTransitionStyle('color') ?? {}) },
    titleHovered: { color: colors.primary },
    desc: { fontSize: 13 * textScale, lineHeight: 19, color: colors.textSecondary, fontFamily: Typography.body },
  });
  return (
    <InteractivePressable onPress={onPress} style={s.pressable} hoverStyle={!preferences.reducedMotion ? s.lift : undefined} accessibilityLabel={title} accessibilityHint={description}>
      {({ hovered }) => (
        <Card variant="elevated" style={[s.card, hovered && s.cardHovered]}>
          <View style={[s.iconWrap, hovered && s.iconWrapHovered]}>
            <Ionicons name={icon} size={22} color={hovered ? colors.primaryLight : colors.primary} />
          </View>
          <View style={s.copy}>
            <Text style={[s.title, hovered && s.titleHovered]}>{title}</Text>
            <Text style={s.desc}>{description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={hovered ? colors.primary : colors.textSecondary} />
        </Card>
      )}
    </InteractivePressable>
  );
}
