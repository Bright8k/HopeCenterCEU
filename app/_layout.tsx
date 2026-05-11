import '../global.css';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';

function AppNavigator() {
  const { colors } = usePreferences();

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
