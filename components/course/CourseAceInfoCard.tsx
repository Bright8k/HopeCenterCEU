import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { useAceSettings } from '@/hooks/useAceSettings';
import { creditUnit, parseObjectives } from '@/lib/ace';
import type { Database } from '@/types/database';
import { Typography } from '@/constants/theme';

type Course = Database['public']['Tables']['courses']['Row'];

/** Course description details the BACB requires providers to publish for each ACE event. */
export function CourseAceInfoCard({ course }: { course: Course }) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const { settings } = useAceSettings();
  const objectives = parseObjectives(course.learning_objectives);
  const awardsCredit = !!creditUnit(course.track) && course.ceu_value > 0;
  const published = course.published_at
    ? new Date(course.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  if (!course.instructor_name && objectives.length === 0 && !awardsCredit) return null;

  return (
    <Card style={styles.card}>
      {objectives.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">Learning objectives</Text>
          {objectives.map((o, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet} accessibilityElementsHidden>•</Text>
              <Text style={styles.body}>{o}</Text>
            </View>
          ))}
        </View>
      )}

      {course.instructor_name ? (
        <View style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">Instructor</Text>
          <Text style={styles.strong}>{course.instructor_name}</Text>
          {course.instructor_credentials ? <Text style={styles.body}>{course.instructor_credentials}</Text> : null}
        </View>
      ) : null}

      {course.disclosures ? (
        <View style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">Disclosures</Text>
          <Text style={styles.body}>{course.disclosures}</Text>
        </View>
      ) : null}

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {settings?.provider_name ?? 'Hope Center for Behavior Change'}
          {awardsCredit ? (settings?.provider_number ? ` · ACE Provider ${settings.provider_number}` : ' · ACE approval pending') : ''}
        </Text>
        <Text style={styles.metaText}>Online, self-paced{published ? ` · Published ${published}` : ''}</Text>
        {awardsCredit && settings?.coordinator_email ? (
          <Pressable
            onPress={() => Linking.openURL(`mailto:${settings.coordinator_email}`)}
            accessibilityRole="link"
            accessibilityLabel={`Email the ACE Coordinator at ${settings.coordinator_email}`}
            accessibilityHint="Opens your email app"
            style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="mail-outline" size={16} color={colors.primary} accessibilityElementsHidden />
            <Text style={styles.contactText}>
              Questions or complaints? Contact the ACE Coordinator. Unresolved complaints can be reported to the BACB.
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    card: { gap: 14 },
    section: { gap: 6 },
    heading: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    bulletRow: { flexDirection: 'row', gap: 8 },
    bullet: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.primary, lineHeight: 21 },
    body: { flex: 1, fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textSecondary, lineHeight: 21 },
    strong: { fontSize: 14 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text },
    meta: { gap: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    metaText: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    contactRow: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44, marginTop: 4 },
    contactText: { flex: 1, fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.primary },
  });
