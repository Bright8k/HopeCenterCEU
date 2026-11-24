import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { usePreferences } from '@/context/PreferencesContext';
import { useAceExport } from '@/hooks/useAceExport';
import { Typography } from '@/constants/theme';

export function AceExportButtons() {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const { exportRecords, exporting, error } = useAceExport();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Records for the BACB</Text>
      <Text style={styles.hint}>Spreadsheets (CSV) of every completion with certificate dates, and of learner feedback.</Text>
      <View style={styles.row}>
        <Button
          title="Completions"
          variant="outline"
          onPress={() => exportRecords('completions')}
          loading={exporting === 'completions'}
          disabled={exporting !== null}
          style={styles.btn}
          accessibilityLabel="Export completion records"
          accessibilityHint="Downloads a CSV of all course completions"
        />
        <Button
          title="Feedback"
          variant="outline"
          onPress={() => exportRecords('feedback')}
          loading={exporting === 'feedback'}
          disabled={exporting !== null}
          style={styles.btn}
          accessibilityLabel="Export learner feedback"
          accessibilityHint="Downloads a CSV of all course feedback"
        />
      </View>
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    wrap: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
    label: { fontSize: 14 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text },
    hint: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary, marginTop: 2, marginBottom: 10, lineHeight: 17 },
    row: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1 },
    error: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.error, marginTop: 8 },
  });
