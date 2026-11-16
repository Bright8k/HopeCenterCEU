import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { useCourseFeedbackList } from '@/hooks/useCourseFeedback';
import { Typography } from '@/constants/theme';

export function CourseFeedbackList({ courseId }: { courseId: string }) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const { items, loading } = useCourseFeedbackList(courseId);
  const average = items.length ? items.reduce((sum, f) => sum + f.rating, 0) / items.length : 0;

  return (
    <View>
      <Text style={styles.sectionLabel}>Learner feedback</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} accessibilityLabel="Loading feedback" />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No feedback yet. Learners are asked after they finish the course.</Text>
      ) : (
        <>
          <Text style={styles.summary}>
            {items.length} response{items.length === 1 ? '' : 's'} · average {average.toFixed(1)} of 5
          </Text>
          {items.map((f) => (
            <View key={f.id} style={styles.item} accessible accessibilityLabel={`Rated ${f.rating} of 5. ${f.comments ?? 'No comments.'}`}>
              <Text style={styles.rating}>
                {f.rating} of 5 · {new Date(f.created_at).toLocaleDateString()}
              </Text>
              {f.comments ? <Text style={styles.comment}>{f.comments}</Text> : null}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    sectionLabel: { fontSize: 11 * textScale, fontFamily: Typography.bodyBold, textTransform: 'uppercase', letterSpacing: 0.6, color: colors.primary, marginBottom: 10, marginTop: 24 },
    empty: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    summary: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text, marginBottom: 8 },
    item: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
    rating: { fontSize: 12 * textScale, fontFamily: Typography.bodyBold, color: colors.textSecondary },
    comment: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.text, marginTop: 4, lineHeight: 20 },
  });
