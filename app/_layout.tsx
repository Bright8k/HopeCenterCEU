import '../global.css';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { LightColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { setupNotificationHandler, setupAndroidChannel, registerPushToken } from '@/lib/notifications';

function AppNavigator() {
  const { colors } = usePreferences();
  const { user } = useAuth();

  useEffect(() => {
    // Configure foreground notification display behaviour and Android channel
    setupNotificationHandler();
    void setupAndroidChannel();

    // Deep-link into the renewal tracker when a reminder notification is tapped
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen as string | undefined;
      if (screen === 'renewal-tracker') {
        router.push('/renewal-tracker');
      }
    });

    return () => sub.remove();
  }, []);

  // Register the Expo push token whenever the authenticated user changes.
  // Silently no-ops on web and simulators.
  useEffect(() => {
    if (user?.id) {
      void registerPushToken(user.id);
    }
  }, [user?.id]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="course" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="profile-edit" />
      <Stack.Screen name="renewal-tracker" />
      <Stack.Screen name="exam" />
      <Stack.Screen name="certificate" />
      <Stack.Screen name="history" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    CormorantGaramond_400Regular_Italic,
  });

  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: LightColors.background,
          }}
        >
          <ActivityIndicator size="large" color={LightColors.primary} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}
