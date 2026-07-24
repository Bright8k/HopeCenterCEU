import 'dotenv/config';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  '';
const devAuthBypass = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true';

// Hard-block auth bypass in production to prevent accidental shipping.
if (process.env.APP_VARIANT === 'production' && devAuthBypass) {
  throw new Error(
    '[app.config.ts] EXPO_PUBLIC_DEV_AUTH_BYPASS must not be true in production builds. ' +
    'Unset the variable or set it to false before building with --profile production.',
  );
}

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
        NSPhotoLibraryUsageDescription:
          'Hope Center CEU uses your photo library to let you upload a course thumbnail or profile picture.',
        NSCameraUsageDescription:
          'Hope Center CEU can use your camera to take a photo for your profile picture or a course thumbnail.',
      },
    },
    android: {
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#8B1A8F' },
      package: 'com.hopecenter.ceu',
      versionCode: 1,
      // Android 13+ requires POST_NOTIFICATIONS to be declared; vibrate is for notification ringtones.
      // RECEIVE_BOOT_COMPLETED lets scheduled notifications survive a device reboot.
      permissions: [
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
        'android.permission.RECEIVE_BOOT_COMPLETED',
      ],
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
