import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Notification tag used to identify renewal reminders ──────────────────────
export const RENEWAL_TAG = 'renewal_reminder';

// ── Handler: called while app is in foreground ───────────────────────────────
export function setupNotificationHandler() {
  if (Platform.OS === 'web') return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ── Android channel (must be created before scheduling) ──────────────────────
export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('renewal-reminders', {
    name: 'CEU Renewal Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#8B1A8F',
    sound: 'default',
  });
}

// ── Permission helpers ────────────────────────────────────────────────────────
export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Cancel all scheduled renewal reminders ───────────────────────────────────
export async function cancelRenewalReminders(): Promise<void> {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.tag === RENEWAL_TAG)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

// ── Schedule renewal reminders ───────────────────────────────────────────────
const REMINDER_OFFSETS: Array<{ daysBefore: number; title: string; body: string }> = [
  {
    daysBefore: 90,
    title: 'CEU renewal in 3 months',
    body: 'Your renewal deadline is in 90 days. Stay on pace with Hope Center CEU.',
  },
  {
    daysBefore: 30,
    title: 'CEU renewal in 1 month',
    body: '30 days until your renewal deadline. Complete a course to stay on track.',
  },
  {
    daysBefore: 7,
    title: 'CEU renewal next week',
    body: 'Your CEU renewal deadline is in 7 days. Open Hope Center CEU.',
  },
  {
    daysBefore: 1,
    title: 'CEU renewal tomorrow',
    body: 'Your renewal deadline is tomorrow. Log in to Hope Center CEU now.',
  },
];

/** Returns the number of notifications successfully scheduled. */
export async function scheduleRenewalReminders(renewalDateIso: string): Promise<number> {
  if (Platform.OS === 'web') return 0;

  await cancelRenewalReminders();

  const renewal = new Date(renewalDateIso);
  let count = 0;

  for (const r of REMINDER_OFFSETS) {
    const trigger = new Date(renewal);
    trigger.setDate(trigger.getDate() - r.daysBefore);

    const secondsFromNow = Math.floor((trigger.getTime() - Date.now()) / 1000);
    if (secondsFromNow <= 0) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: r.title,
        body: r.body,
        data: { tag: RENEWAL_TAG, screen: 'renewal-tracker' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
      },
    });
    count++;
  }

  return count;
}
