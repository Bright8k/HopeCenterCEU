import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePreferences } from '@/context/PreferencesContext';
import { useCourseFeedback } from '@/hooks/useCourseFeedback';
import { tapHaptic } from '@/lib/haptics';
import { Typography } from '@/constants/theme';

const RATINGS = [1, 2, 3, 4, 5];

/** Shown once a learner has completed the course; providers must offer written feedback. */
export function CourseFeedbackCard({ courseId }: { courseId: string }) {
  const { colors, textScale, preferences } = usePreferences();
  const styles = createStyles(colors, textScale);
  const { completed, feedback, loading, saving, error, submit } = useCourseFeedback(courseId);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (feedback) {
      setRating(feedback.rating);
      setComments(feedback.comments ?? '');
    }
  }, [feedback]);

  if (loading || !completed) return null;

  if (feedback && !editing) {
    return (
      <Card style={styles.card}>
        <View style={styles.thanksRow}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} accessibilityElementsHidden />
          <Text style={styles.title}>Thanks for your feedback</Text>
        </View>
        <Button title="Edit feedback" variant="ghost" onPress={() => setEditing(true)} />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">How was this course?</Text>
      <Text style={styles.hint}>Your feedback goes to the ACE Coordinator and instructor.</Text>
      <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel="Course rating">
        {RATINGS.map((n) => (
          <Pressable
            key={n}
            onPress={() => { tapHaptic(preferences.haptics); setRating(n); }}
            accessibilityRole="radio"
            accessibilityLabel={`${n} of 5`}
            accessibilityState={{ checked: rating === n }}
            style={styles.star}
          >
            <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={28} color={n <= rating ? colors.accentDark : colors.textSecondary} />
          </Pressable>
        ))}
      </View>
      <Input
        label="Comments (optional)"
        value={comments}
        onChangeText={setComments}
        multiline
        maxLength={2000}
        style={styles.multiline}
        placeholder="What worked? What could be better?"
      />
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      <Button
        title="Send feedback"
        onPress={async () => { if (await submit(rating, comments)) setEditing(false); }}
        loading={saving}
        disabled={rating === 0}
        accessibilityHint={rating === 0 ? 'Choose a rating first' : undefined}
      />
    </Card>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    card: { gap: 8 },
    thanksRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    hint: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    stars: { flexDirection: 'row', gap: 4, marginVertical: 4 },
    star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
    error: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.error },
  });
