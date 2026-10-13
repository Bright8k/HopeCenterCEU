import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Light tap feedback for buttons. Callers pass the user's haptics preference. */
export function tapHaptic(enabled: boolean) {
  if (!enabled || Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
