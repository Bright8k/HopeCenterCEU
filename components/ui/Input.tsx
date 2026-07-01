import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, getWebTransitionStyle } from '@/constants/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, style, ...props }: InputProps) {
  const { colors, textScale } = usePreferences();

  // Strip trailing " *" for the accessibility label so screen readers say
  // "Email address" not "Email address asterisk".
  const a11yLabel = label?.replace(/\s*\*+\s*$/, '').trim();
  const isRequired = label?.includes('*') ?? false;

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[styles.label, { color: colors.text, fontSize: 14 * textScale }]}
          nativeID={a11yLabel}
        >
          {label}
        </Text>
      )}
      <TextInput
        accessibilityLabel={a11yLabel}
        aria-required={isRequired}
        accessibilityHint={hint}
        accessibilityState={{ disabled: props.editable === false }}
        style={[
          styles.input,
          {
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
            backgroundColor: colors.card,
            fontSize: 16 * textScale,
            ...(getWebTransitionStyle('border-color, background-color, color') ?? {}),
          },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
      {hint && !error && (
        <Text style={[styles.hint, { color: colors.textSecondary, fontSize: 12 * textScale }]}>
          {hint}
        </Text>
      )}
      {error && (
        <Text
          style={[styles.error, { color: colors.error, fontSize: 12 * textScale }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: Typography.bodySemiBold,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Typography.body,
    minHeight: 48,
  },
  hint: {
    fontFamily: Typography.body,
    marginTop: 4,
    lineHeight: 18,
  },
  error: {
    fontFamily: Typography.bodySemiBold,
    marginTop: 4,
  },
});
