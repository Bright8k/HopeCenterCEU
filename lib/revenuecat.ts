import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const RC_API_KEY_IOS = 'YOUR_REVENUECAT_IOS_API_KEY';
const RC_API_KEY_ANDROID = 'YOUR_REVENUECAT_ANDROID_API_KEY';

export function initRevenueCat() {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  Purchases.configure({ apiKey });
}

export { Purchases };
