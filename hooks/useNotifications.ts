import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getPermissionStatus, requestNotificationPermissions } from '@/lib/notifications';

type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export function useNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');

  useEffect(() => {
    if (Platform.OS === 'web') {
      setPermissionStatus('unavailable');
      return;
    }
    getPermissionStatus().then(setPermissionStatus);
  }, []);

  async function requestPermission(): Promise<boolean> {
    const granted = await requestNotificationPermissions();
    setPermissionStatus(granted ? 'granted' : 'denied');
    return granted;
  }

  return {
    permissionStatus,
    permissionGranted: permissionStatus === 'granted',
    requestPermission,
  };
}
