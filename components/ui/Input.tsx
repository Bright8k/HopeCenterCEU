import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, getWebTransitionStyle } from '@/constants/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors } = usePreferences();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
            backgroundColor: colors.card,
            ...(getWebTransitionStyle('border-color, background-color, color') ?? {}),
          },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: Typography.bodySemiBold,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Typography.body,
  },
  error: {
    fontSize: 12,
    fontFamily: Typography.bodySemiBold,
    marginTop: 4,
  },
});
