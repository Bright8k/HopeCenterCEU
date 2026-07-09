import 'dotenv/config';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  '';
const devAuthBypass = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true';

export default {
  expo: {
    owner: 'dbright34517',
    name: 'Hope Center CEU',
    slug: 'hope-center-ceu',
    version: '1.0.0',
    scheme: 'hopecenterceu',
    privacy: 'unlisted',
    orientation: 'portrait',
    icon: './assets/icon.png',
    splash: { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#8B1A8F' },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.hopecenter.ceu',
      infoPlist: {
        NSUserNotificationUsageDescription:
          'Hope Center CEU sends reminders when your CEU renewal deadline is approaching.',
      },
    },
    android: {
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#8B1A8F' },
      package: 'com.hopecenter.ceu',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      'expo-video',
      ['expo-notifications', { icon: './assets/notification-icon.png', color: '#8B1A8F' }],
    ],
    extra: {
      supabaseUrl,
      supabasePublishableKey,
      devAuthBypass,
      eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '' },
    },
  },
};
