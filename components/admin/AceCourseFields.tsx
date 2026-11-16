import { StyleSheet, Text } from 'react-native';
import { Input } from '@/components/ui/Input';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography } from '@/constants/theme';

export interface AceCourseValues {
  instructorName: string;
  instructorCredentials: string;
  learningObjectives: string;
  disclosures: string;
}

interface AceCourseFieldsProps {
  values: AceCourseValues;
  onChange: (values: AceCourseValues) => void;
}

export function AceCourseFields({ values, onChange }: AceCourseFieldsProps) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const set = (key: keyof AceCourseValues) => (text: string) => onChange({ ...values, [key]: text });

  return (
    <>
      <Text style={styles.sectionLabel}>ACE details</Text>
      <Text style={styles.hint}>
        Shown on the course page and certificate. Required before a course with CEUs or PDUs can be approved.
      </Text>
      <Input label="Instructor name" value={values.instructorName} onChangeText={set('instructorName')} autoCapitalize="words" placeholder="e.g. Jane Doe, PhD, BCBA-D" />
      <Input
        label="Instructor qualifications"
        value={values.instructorCredentials}
        onChangeText={set('instructorCredentials')}
        placeholder="Credential and expertise on this topic"
        multiline
        style={styles.multiline}
      />
      <Input
        label="Learning objectives"
        value={values.learningObjectives}
        onChangeText={set('learningObjectives')}
        placeholder={'One per line, e.g.\nDescribe three functions of behavior'}
        multiline
        style={styles.multiline}
        hint="One objective per line."
      />
      <Input
        label="Affiliation disclosures"
        value={values.disclosures}
        onChangeText={set('disclosures')}
        placeholder="Companies, products, or services featured in this course"
        multiline
        style={styles.multiline}
        hint="Leave blank if there are none."
      />
    </>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    sectionLabel: { fontSize: 11 * textScale, fontFamily: Typography.bodyBold, textTransform: 'uppercase', letterSpacing: 0.6, color: colors.primary, marginBottom: 6, marginTop: 8 },
    hint: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary, marginBottom: 12, lineHeight: 17 },
    multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  });
