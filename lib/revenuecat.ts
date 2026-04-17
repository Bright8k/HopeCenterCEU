import Constants from 'expo-constants';
import { Platform } from 'react-native';

const RC_API_KEY_IOS = 'YOUR_REVENUECAT_IOS_API_KEY';
const RC_API_KEY_ANDROID = 'YOUR_REVENUECAT_ANDROID_API_KEY';

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

export async function initRevenueCat() {
  if (isExpoGo()) {
    return null;
  }

  const { default: Purchases, LOG_LEVEL } = await import('react-native-purchases');
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  Purchases.configure({ apiKey });

  return Purchases;
}
