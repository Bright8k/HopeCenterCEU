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
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { setupNotificationHandler, setupAndroidChannel } from '@/lib/notifications';

function AppNavigator() {
  const { colors } = usePreferences();

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
  });

  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F7F2F6',
          }}
        >
          <ActivityIndicator size="large" color="#8B1A8F" />
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
