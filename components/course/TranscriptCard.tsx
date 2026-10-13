import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography } from '@/constants/theme';

interface TranscriptCardProps {
  transcript: string;
}

export function TranscriptCard({ transcript }: TranscriptCardProps) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const [expanded, setExpanded] = useState(false);

  const blocks = transcript
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Transcript"
        accessibilityHint={expanded ? 'Collapses the lesson transcript' : 'Expands the full lesson transcript'}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.75 }]}
      >
        <Ionicons name="document-text-outline" size={18} color={colors.primary} accessibilityElementsHidden />
        <Text style={styles.title}>Transcript</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} accessibilityElementsHidden />
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          {blocks.map((block, i) =>
            block.startsWith('## ') ? (
              <Text key={i} style={styles.heading} accessibilityRole="header">
                {block.slice(3)}
              </Text>
            ) : (
              <Text key={i} style={styles.paragraph}>
                {block}
              </Text>
            ),
          )}
        </View>
      )}
    </Card>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    card: { gap: 4 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
    title: { flex: 1, fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    body: { gap: 12, paddingTop: 4 },
    heading: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginTop: 6 },
    paragraph: { fontSize: 14 * textScale, lineHeight: 22 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
  });
