type NotificationPermissionState = 'granted' | 'denied' | 'undetermined';

type NotificationPermissionsModule = {
  getPermissionsAsync: () => Promise<{ granted: boolean; status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
};

const loadNotificationPermissionsModule = async (): Promise<NotificationPermissionsModule> =>
  import('expo-notifications/build/NotificationPermissions');

const normalizePermission = (status: string): NotificationPermissionState => {
  if (status === 'granted') {
    return 'granted';
  }

  if (status === 'denied') {
    return 'denied';
  }

  return 'undetermined';
};

export const notificationPermissionsService = {
  getStatus: async (): Promise<NotificationPermissionState> => {
    const notifications = await loadNotificationPermissionsModule();
    const status = await notifications.getPermissionsAsync();
    return normalizePermission(status.status);
  },
  requestStatus: async (): Promise<NotificationPermissionState> => {
    const notifications = await loadNotificationPermissionsModule();
    const currentStatus = await notifications.getPermissionsAsync();
    const finalStatus = currentStatus.granted ? currentStatus.status : (await notifications.requestPermissionsAsync()).status;
    return normalizePermission(finalStatus);
  },
};

export type { NotificationPermissionState };
