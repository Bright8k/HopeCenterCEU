import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useState } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, getWebTransitionStyle, withAlpha } from '@/constants/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, style, ...props }: InputProps) {
  const { colors, textScale } = usePreferences();
  const [isFocused, setIsFocused] = useState(false);

  const a11yLabel = label?.replace(/\s*\*+\s*$/, '').trim();
  const isRequired = label?.includes('*') ?? false;

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;

  const shadowStyle = isFocused && !error
    ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowRadius: 6, shadowOpacity: 0.18, elevation: 0 }
    : {};

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[styles.label, { color: isFocused ? colors.primary : colors.text, fontSize: 13 * textScale }]}
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
        onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
        style={[
          styles.input,
          {
            borderColor,
            borderWidth: isFocused || error ? 2 : 1.5,
            color: colors.text,
            backgroundColor: colors.card,
            fontSize: 15 * textScale,
          },
          shadowStyle,
          { ...(getWebTransitionStyle('border-color, box-shadow') ?? {}) },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {hint && !error && (
        <Text style={[styles.hint, { color: colors.textMuted, fontSize: 12 * textScale }]}>
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
    marginBottom: 7,
    letterSpacing: 0.1,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: Typography.body,
    minHeight: 50,
  },
  hint: {
    fontFamily: Typography.body,
    marginTop: 5,
    lineHeight: 18,
  },
  error: {
    fontFamily: Typography.bodySemiBold,
    marginTop: 5,
  },
});
