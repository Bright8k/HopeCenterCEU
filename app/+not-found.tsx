import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { usePreferences } from '@/context/PreferencesContext';
import { withAlpha } from '@/constants/theme';

export default function NotFoundScreen() {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Not found',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <Card variant="elevated" style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="compass-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>This page wandered off</Text>
          <Text style={styles.text}>
            The screen you tried to open is not available right now. Head back to the Hope Center home flow and continue from there.
          </Text>
          <Link href="/" asChild>
            <InteractivePressable style={styles.link} hoverStyle={styles.linkHover}>
              <Text style={styles.linkText}>Return to home</Text>
            </InteractivePressable>
          </Link>
        </Card>
      </View>
    </>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      alignItems: 'center',
      paddingVertical: 28,
    },
    iconWrap: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '12'),
      marginBottom: 16,
    },
    title: {
      fontSize: 24 * textScale,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    text: {
      fontSize: 14 * textScale,
      lineHeight: 21,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 18,
    },
    link: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: withAlpha(colors.primary, '10'),
    },
    linkHover: {
      transform: [{ translateY: -1 }],
      backgroundColor: withAlpha(colors.primary, '16'),
    },
    linkText: {
      fontSize: 14 * textScale,
      color: colors.primary,
      fontWeight: '700',
    },
  });
