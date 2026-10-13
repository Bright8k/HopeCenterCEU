import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { useCourseSlides } from '@/hooks/useCourseSlides';
import { SlidesViewerModal } from '@/components/course/SlidesViewerModal';
import { Typography, withAlpha } from '@/constants/theme';

interface SlidesCardProps {
  slidesPath: string;
}

export function SlidesCard({ slidesPath }: SlidesCardProps) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const { viewerUrl, openViewer, closeViewer, openExternal, opening, error } = useCourseSlides(slidesPath);

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={openViewer}
        disabled={opening}
        accessibilityRole="button"
        accessibilityLabel="Open follow-along slides"
        accessibilityHint="Opens the lesson slide deck in a full-screen viewer"
        accessibilityState={{ busy: opening }}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="easel-outline" size={20} color={colors.primary} accessibilityElementsHidden />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Follow-along slides</Text>
          <Text style={styles.subtitle}>View the slide deck (PDF) alongside the lesson</Text>
        </View>
        {opening ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} accessibilityElementsHidden />
        )}
      </Pressable>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <SlidesViewerModal url={viewerUrl} onClose={closeViewer} onOpenExternal={openExternal} />
    </Card>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    card: { gap: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
    iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(colors.primary, '18') },
    textWrap: { flex: 1, gap: 2 },
    title: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    subtitle: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    error: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.error },
  });
