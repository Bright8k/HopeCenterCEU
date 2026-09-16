import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, withAlpha } from '@/constants/theme';

type CourseStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export function StatusBanner({ status, reviewNote }: { status: CourseStatus; reviewNote: string | null }) {
  const { colors, textScale } = usePreferences();
  const config: Record<CourseStatus, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; bg: string }> = {
    draft:          { icon: 'document-outline',        label: 'Draft — not visible to learners',    color: colors.textSecondary, bg: colors.surface },
    pending_review: { icon: 'hourglass-outline',       label: 'Awaiting review',                    color: colors.warning,       bg: withAlpha(colors.warning, '18') },
    published:      { icon: 'checkmark-circle-outline',label: 'Published — live for learners',      color: colors.success,       bg: withAlpha(colors.success, '14') },
    archived:       { icon: 'archive-outline',         label: 'Archived — hidden from learners',    color: colors.textMuted,     bg: colors.surfaceMuted },
  };
  const { icon, label, color, bg } = config[status] ?? config.draft;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, marginBottom: 18, backgroundColor: bg }}>
      <Ionicons name={icon} size={16} color={color} accessibilityElementsHidden />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, lineHeight: 18, color }}>{label}</Text>
        {reviewNote ? <Text style={{ fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary, marginTop: 2, lineHeight: 17 }}>Reviewer note: {reviewNote}</Text> : null}
      </View>
    </View>
  );
}
