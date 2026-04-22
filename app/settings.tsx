import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AppBrand } from '@/components/ui/AppBrand';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, getWebTransitionStyle, withAlpha } from '@/constants/theme';

type ThemeMode = 'system' | 'light' | 'dark';

export default function SettingsScreen() {
  const { colors, preferences, resolvedTheme, setThemeMode, updatePreference, textScale } =
    usePreferences();
  const styles = createStyles(colors, textScale);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: Typography.bodyBold,
            fontSize: 18,
            color: colors.text,
          },
          headerTitleAlign: 'center',
          headerLeft: () => <AppBrand compact logoOnly style={{ marginLeft: 12 }} />,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Hope Center Preferences</Text>
          <Text style={styles.heroTitle}>Make the app work the way you do.</Text>
          <Text style={styles.heroText}>
            Adjust appearance, accessibility, audio, reminders, downloads, and privacy in one place.
          </Text>
          <View style={styles.heroMetaRow}>
            <Badge label={`${resolvedTheme === 'dark' ? 'Dark' : 'Light'} active`} />
            <Badge label={preferences.highContrast ? 'High contrast' : 'Standard contrast'} variant="muted" />
          </View>
        </View>

        <SettingsSection title="Appearance" description="Choose how the app looks across your devices.">
          <Card variant="elevated">
            <View style={styles.themeRow}>
              <ThemeChip label="System" mode="system" current={preferences.themeMode} onPress={setThemeMode} />
              <ThemeChip label="Light" mode="light" current={preferences.themeMode} onPress={setThemeMode} />
              <ThemeChip label="Dark" mode="dark" current={preferences.themeMode} onPress={setThemeMode} />
            </View>
            <SettingRow
              label="Remember library filters"
              description="Keep your track and search preferences between visits."
              value={preferences.rememberFilters}
              onValueChange={(value) => updatePreference('rememberFilters', value)}
            />
          </Card>
        </SettingsSection>

        <SettingsSection title="Accessibility" description="Support comfortable reading, motion, and contrast needs.">
          <Card variant="elevated">
            <SettingRow
              label="Larger text"
              description="Increase sizing across headings and body text."
              value={preferences.largerText}
              onValueChange={(value) => updatePreference('largerText', value)}
            />
            <SettingRow
              label="Reduce motion"
              description="Limit movement and animation intensity in the interface."
              value={preferences.reducedMotion}
              onValueChange={(value) => updatePreference('reducedMotion', value)}
            />
            <SettingRow
              label="High contrast"
              description="Boost text and border contrast for stronger legibility."
              value={preferences.highContrast}
              onValueChange={(value) => updatePreference('highContrast', value)}
            />
            <SettingRow
              label="Voice prompts"
              description="Enable spoken guidance for future quizzes and media."
              value={preferences.voicePrompts}
              onValueChange={(value) => updatePreference('voicePrompts', value)}
            />
          </Card>
        </SettingsSection>

        <SettingsSection title="Audio and Video" description="Control playback behavior and sound feedback.">
          <Card variant="elevated">
            <SettingRow
              label="Sound effects"
              description="Play interface feedback sounds for actions and completion moments."
              value={preferences.soundEffects}
              onValueChange={(value) => updatePreference('soundEffects', value)}
            />
            <SettingRow
              label="Autoplay lesson video"
              description="Start course videos automatically when a lesson opens."
              value={preferences.autoplayVideo}
              onValueChange={(value) => updatePreference('autoplayVideo', value)}
            />
            <SettingRow
              label="Haptics"
              description="Use vibration feedback for selection and progress states."
              value={preferences.haptics}
              onValueChange={(value) => updatePreference('haptics', value)}
            />
          </Card>
        </SettingsSection>

        <SettingsSection title="General" description="Choose how the app syncs and keeps you on track.">
          <Card variant="elevated">
            <SettingRow
              label="Push reminders"
              description="Receive reminders for upcoming CEU goals and deadlines."
              value={preferences.pushReminders}
              onValueChange={(value) => updatePreference('pushReminders', value)}
            />
            <SettingRow
              label="Email updates"
              description="Get new course releases and support updates by email."
              value={preferences.emailUpdates}
              onValueChange={(value) => updatePreference('emailUpdates', value)}
            />
            <SettingRow
              label="Download over cellular"
              description="Allow future lessons and attachments to sync on mobile data."
              value={preferences.downloadOverCellular}
              onValueChange={(value) => updatePreference('downloadOverCellular', value)}
            />
          </Card>
        </SettingsSection>

        <SettingsSection title="Privacy" description="Choose how much learning activity is shown and stored locally.">
          <Card variant="elevated">
            <SettingRow
              label="Private mode"
              description="Reduce visible progress details on shared screens and future widgets."
              value={preferences.privateMode}
              onValueChange={(value) => updatePreference('privateMode', value)}
            />
          </Card>
        </SettingsSection>
      </ScrollView>
    </>
  );

  function ThemeChip({
    label,
    mode,
    current,
    onPress,
  }: {
    label: string;
    mode: ThemeMode;
    current: ThemeMode;
    onPress: (mode: ThemeMode) => void;
  }) {
    const isActive = current === mode;
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Pressable
        onPress={() => onPress(mode)}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={({ pressed }) => [
          styles.themeChip,
          isActive && styles.themeChipActive,
          isHovered && styles.themeChipHovered,
          pressed && styles.themeChipPressed,
        ]}
      >
        <Text style={[styles.themeChipText, isActive && styles.themeChipTextActive]}>{label}</Text>
      </Pressable>
    );
  }

  function SettingRow({
    label,
    description,
    value,
    onValueChange,
  }: {
    label: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) {
    return (
      <View style={styles.settingRow}>
        <View style={styles.settingCopy}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.surfaceMuted, true: withAlpha(colors.primary, '66') }}
          thumbColor={value ? colors.primary : colors.white}
        />
      </View>
    );
  }
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
      {children}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
      gap: 20,
    },
    hero: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroEyebrow: {
      fontSize: 12,
      fontFamily: Typography.bodyBold,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: 8,
    },
    heroTitle: {
      fontSize: 26 * textScale,
      fontFamily: Typography.heading,
      color: colors.text,
      marginBottom: 8,
    },
    heroText: {
      fontSize: 14 * textScale,
      lineHeight: 21,
      color: colors.textSecondary,
      marginBottom: 14,
      fontFamily: Typography.body,
    },
    heroMetaRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    section: {
      gap: 10,
    },
    sectionTitle: {
      fontSize: 18 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
    },
    sectionDescription: {
      fontSize: 13 * textScale,
      lineHeight: 19,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    themeRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 18,
      flexWrap: 'wrap',
    },
    themeChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    themeChipActive: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, '15'),
    },
    themeChipHovered: {
      transform: [{ translateY: -1 }],
      backgroundColor: colors.card,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    themeChipPressed: {
      transform: [{ scale: 0.98 }],
    },
    themeChipText: {
      fontSize: 13 * textScale,
      fontFamily: Typography.bodySemiBold,
      color: colors.textSecondary,
      ...(getWebTransitionStyle('color') ?? {}),
    },
    themeChipTextActive: {
      color: colors.primary,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      paddingVertical: 12,
    },
    settingCopy: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 15 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13 * textScale,
      lineHeight: 19,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
  });
