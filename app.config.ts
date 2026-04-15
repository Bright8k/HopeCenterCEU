import 'dotenv/config';

export default {
  expo: {
    name: 'Hope Center CEU',
    slug: 'hope-center-ceu',
    version: '1.0.0',
    scheme: 'hopecenterceu',
    orientation: 'portrait',
    icon: './assets/icon.png',
    splash: { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#8B1A8F' },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.hopecenter.ceu',
    },
    android: {
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#8B1A8F' },
      package: 'com.hopecenter.ceu',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-video',
      ['expo-notifications', { icon: './assets/notification-icon.png', color: '#8B1A8F' }],
    ],
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '' },
    },
  },
};
