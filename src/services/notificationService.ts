import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSetting, setSetting } from '../db';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  time: string; // HH:mm format
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Get current notification settings
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const enabled = await getSetting('notificationsEnabled');
  const time = await getSetting('notificationTime');

  return {
    enabled: enabled === 'true',
    time: time || '20:00',
  };
}

// Save notification settings
export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  await setSetting('notificationsEnabled', settings.enabled.toString());
  await setSetting('notificationTime', settings.time);

  if (settings.enabled) {
    await scheduleDailyReminder(settings.time);
  } else {
    await cancelAllReminders();
  }
}

// Schedule daily reminder notification
export async function scheduleDailyReminder(time: string): Promise<void> {
  // Cancel existing notifications first
  await cancelAllReminders();

  // Parse time string (HH:mm)
  const [hours, minutes] = time.split(':').map(Number);

  // Schedule the notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Track your expenses',
      body: "Don't forget to log today's expenses!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
}

// Cancel all scheduled notifications
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
  const settings = await getNotificationSettings();
  return settings.enabled;
}

// Initialize notifications on app start
export async function initializeNotifications(): Promise<void> {
  const settings = await getNotificationSettings();

  if (settings.enabled) {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      await scheduleDailyReminder(settings.time);
    } else {
      // Permission denied, disable notifications
      await saveNotificationSettings({ ...settings, enabled: false });
    }
  }
}

// Get all scheduled notifications (for debugging)
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
