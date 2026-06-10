import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { HOPE_CENTER_LOGO_URI } from '@/constants/brand';
import { Typography } from '@/constants/theme';

type AppBrandProps = {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  showSubtitle?: boolean;
  logoOnly?: boolean;
  onPress?: () => void;
};

export function AppBrand({
  style,
  compact = false,
  showSubtitle = true,
  logoOnly = false,
  onPress,
}: AppBrandProps) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale, compact);

  const inner = (
    <>
      <Image source={{ uri: HOPE_CENTER_LOGO_URI }} style={styles.logo} resizeMode="contain" />
      {!logoOnly ? (
        <View style={styles.copy}>
          <Text style={styles.title}>Hope Center</Text>
          {showSubtitle ? (
            <Text style={styles.subtitle}>for Behavior Change</Text>
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Go to dashboard"
        accessibilityHint="Navigates to the home dashboard"
        style={({ pressed }) => [styles.wrap, style, pressed && { opacity: 0.7 }]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={[styles.wrap, style]}>{inner}</View>;
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
  compact: boolean,
) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? 8 : 10,
    },
    logo: {
      width: compact ? 42 : 52,
      height: compact ? 42 : 52,
      borderRadius: compact ? 21 : 26,
    },
    copy: {
      justifyContent: 'center',
    },
    title: {
      fontFamily: Typography.bodyBold,
      fontSize: (compact ? 15 : 17) * textScale,
      lineHeight: compact ? 18 : 21,
      color: colors.text,
    },
    subtitle: {
      fontFamily: Typography.bodySemiBold,
      fontSize: (compact ? 11 : 12) * textScale,
      lineHeight: compact ? 14 : 16,
      color: colors.textSecondary,
    },
  });
