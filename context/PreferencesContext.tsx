import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DarkColors, LightColors, type AppColors } from '@/constants/theme';

type ThemeMode = 'system' | 'light' | 'dark';

type PreferenceKey =
  | 'reducedMotion'
  | 'largerText'
  | 'highContrast'
  | 'soundEffects'
  | 'voicePrompts'
  | 'autoplayVideo'
  | 'downloadOverCellular'
  | 'pushReminders'
  | 'emailUpdates'
  | 'haptics'
  | 'privateMode'
  | 'rememberFilters';

type Preferences = {
  themeMode: ThemeMode;
  reducedMotion: boolean;
  largerText: boolean;
  highContrast: boolean;
  soundEffects: boolean;
  voicePrompts: boolean;
  autoplayVideo: boolean;
  downloadOverCellular: boolean;
  pushReminders: boolean;
  emailUpdates: boolean;
  haptics: boolean;
  privateMode: boolean;
  rememberFilters: boolean;
};

type PreferencesContextType = {
  preferences: Preferences;
  colors: AppColors;
  resolvedTheme: 'light' | 'dark';
  textScale: number;
  setThemeMode: (mode: ThemeMode) => void;
  updatePreference: (key: PreferenceKey, value: boolean) => void;
};

const STORAGE_KEY = 'hope_center_preferences';

const defaultPreferences: Preferences = {
  themeMode: 'system',
  reducedMotion: false,
  largerText: false,
  highContrast: false,
  soundEffects: true,
  voicePrompts: false,
  autoplayVideo: true,
  downloadOverCellular: false,
  pushReminders: true,
  emailUpdates: true,
  haptics: true,
  privateMode: false,
  rememberFilters: true,
};

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: defaultPreferences,
  colors: LightColors,
  resolvedTheme: 'light',
  textScale: 1,
  setThemeMode: () => {},
  updatePreference: () => {},
});

async function readStoredPreferences() {
  try {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
    }

    return await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function writeStoredPreferences(value: string) {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(STORAGE_KEY, value);
      return;
    }

    await SecureStore.setItemAsync(STORAGE_KEY, value);
  } catch {
    // Ignore preference persistence failures so settings never block app usage.
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? Appearance.getColorScheme() ?? 'light';
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    readStoredPreferences().then((stored) => {
      if (!stored || !isActive) {
        setIsLoaded(true);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as Partial<Preferences>;
        setPreferences((current) => ({ ...current, ...parsed }));
      } catch {
        // Ignore malformed data and fall back to defaults.
      } finally {
        if (isActive) {
          setIsLoaded(true);
        }
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    void writeStoredPreferences(JSON.stringify(preferences));
  }, [isLoaded, preferences]);

  const resolvedTheme =
    preferences.themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preferences.themeMode;

  const colors = useMemo(() => {
    if (resolvedTheme === 'dark') {
      return preferences.highContrast
        ? {
            ...DarkColors,
            text: '#FFFFFF',
            textSecondary: '#F0DFF0',
            border: '#6D4D70',
          }
        : DarkColors;
    }

    return preferences.highContrast
      ? {
          ...LightColors,
          text: '#111111',
          textSecondary: '#3C333C',
          border: '#CCB8CC',
        }
      : LightColors;
  }, [preferences.highContrast, resolvedTheme]);

  const value = useMemo<PreferencesContextType>(
    () => ({
      preferences,
      colors,
      resolvedTheme,
      textScale: preferences.largerText ? 1.08 : 1,
      setThemeMode: (mode) => setPreferences((current) => ({ ...current, themeMode: mode })),
      updatePreference: (key, value) =>
        setPreferences((current) => ({
          ...current,
          [key]: value,
        })),
    }),
    [colors, preferences, resolvedTheme]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
