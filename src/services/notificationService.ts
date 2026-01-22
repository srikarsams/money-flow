import { getSetting, setSetting } from '../db';

export interface NotificationSettings {
  enabled: boolean;
  time: string; // HH:mm format
}

// In Expo Go (SDK 53+), expo-notifications is not supported
// These are stub implementations - notifications will work in dev builds
const NOTIFICATIONS_AVAILABLE = false;

// Check if notifications are supported
export function isNotificationsSupported(): boolean {
  return NOTIFICATIONS_AVAILABLE;
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  // Not available in Expo Go
  return false;
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

  // Actual scheduling will happen in dev builds
  if (NOTIFICATIONS_AVAILABLE && settings.enabled) {
    await scheduleDailyReminder(settings.time);
  } else if (NOTIFICATIONS_AVAILABLE) {
    await cancelAllReminders();
  }
}

// Schedule daily reminder notification (stub for Expo Go)
export async function scheduleDailyReminder(_time: string): Promise<void> {
  // Will be implemented in dev build
}

// Cancel all scheduled notifications (stub for Expo Go)
export async function cancelAllReminders(): Promise<void> {
  // Will be implemented in dev build
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
  const settings = await getNotificationSettings();
  return settings.enabled;
}

// Initialize notifications on app start (stub for Expo Go)
export async function initializeNotifications(): Promise<void> {
  // Will be implemented in dev build
}

// Get all scheduled notifications (stub for Expo Go)
export async function getScheduledNotifications(): Promise<any[]> {
  return [];
}
