import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography } from '@/constants/theme';

export default function AdminLayout() {
  const { loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const { colors } = usePreferences();

  if (authLoading || adminLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAdmin) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: Typography.heading, fontSize: 18, color: colors.text },
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin Portal' }} />
      <Stack.Screen name="courses" options={{ title: 'Manage Courses' }} />
      <Stack.Screen name="course-edit" options={{ title: 'Course' }} />
      <Stack.Screen name="questions" options={{ title: 'Question Bank' }} />
      <Stack.Screen name="question-edit" options={{ title: 'Question' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="users" options={{ title: 'Learners' }} />
      <Stack.Screen name="user-detail" options={{ title: 'Learner Detail' }} />
      <Stack.Screen name="invite" options={{ title: 'Invite Learner' }} />
    </Stack>
  );
}
