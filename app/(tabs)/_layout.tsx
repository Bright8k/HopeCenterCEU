import { Tabs, router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useState } from 'react';
import Constants from 'expo-constants';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { AppBrand } from '@/components/ui/AppBrand';
import { hasSupabaseEnv } from '@/lib/supabase';
import { Typography } from '@/constants/theme';

export default function TabLayout() {
  const { role, session, loading } = useAuth();
  const { colors } = usePreferences();
  const isStudent = role === 'STUDENT';
  const devAuthBypass = Boolean(Constants.expoConfig?.extra?.devAuthBypass);

  // Declarative auth guard: redirect to sign-in when the Supabase session is cleared (sign-out).
  // Bypassed in dev-bypass mode (no real session exists there by design).
  if (hasSupabaseEnv && !devAuthBypass && !loading && !session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: Typography.heading,
          fontSize: 18,
          color: colors.text,
        },
        headerTitleAlign: 'center',
        headerLeft: () => (
          <AppBrand
            compact
            logoOnly
            style={{ marginLeft: 12 }}
            onPress={() => router.navigate('/(tabs)')}
          />
        ),
        headerRight: () => <SettingsHeaderButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: isStudent ? 'Courses' : 'CEU Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exam"
        options={{
          title: 'Exam Prep',
          href: isStudent ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function SettingsHeaderButton() {
  const { colors } = usePreferences();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      accessibilityHint="Opens the settings screen"
      onPress={() => router.push('/settings')}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        {
          marginRight: 8,
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isHovered ? colors.surface : 'transparent',
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.96 : isHovered ? 1.03 : 1 }],
        },
      ]}
    >
      <Ionicons name="settings-outline" size={20} color={colors.text} />
    </Pressable>
  );
}
