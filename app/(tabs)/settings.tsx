import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Card } from '@/src/components/ui';
import { useTheme } from '@/src/hooks/useTheme';
import { getSetting, setSetting } from '@/src/db';
import { isPremium } from '@/src/services/purchaseService';
import { exportExpenses, exportInvestments, exportAll } from '@/src/services/exportService';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
} from '@/src/services/notificationService';

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
}

function SettingRow({
  icon,
  iconColor = '#6366F1',
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
}: SettingRowProps) {
  const { isDark } = useTheme();

  const content = (
    <View className="flex-row items-center py-3">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: iconColor + '20' }}
      >
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-base text-slate-900 dark:text-white">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement}
      {showArrow && onPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? '#64748B' : '#94A3B8'}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const [premium, setPremium] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('20:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSettings = async () => {
    try {
      const [premiumStatus, themeValue, notifSettings] = await Promise.all([
        isPremium(),
        getSetting('theme'),
        getNotificationSettings(),
      ]);

      setPremium(premiumStatus);
      setTheme((themeValue as 'light' | 'dark' | 'system') || 'system');
      setNotificationsEnabled(notifSettings.enabled);
      setNotificationTime(notifSettings.time);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    await setSetting('theme', newTheme);
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    }

    setNotificationsEnabled(enabled);
    await saveNotificationSettings({ enabled, time: notificationTime });
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;

      setNotificationTime(newTime);
      await saveNotificationSettings({ enabled: notificationsEnabled, time: newTime });
    }
  };

  const handleExport = async (type: 'expenses' | 'investments' | 'all') => {
    if (!premium) {
      router.push('/paywall');
      return;
    }

    setExporting(true);
    try {
      if (type === 'expenses') {
        await exportExpenses();
      } else if (type === 'investments') {
        await exportInvestments();
      } else {
        await exportAll();
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const showExportOptions = () => {
    Alert.alert('Export Data', 'Choose what to export', [
      { text: 'Expenses Only', onPress: () => handleExport('expenses') },
      { text: 'Investments Only', onPress: () => handleExport('investments') },
      { text: 'Everything', onPress: () => handleExport('all') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const showThemeOptions = () => {
    Alert.alert('Theme', 'Choose your preferred theme', [
      {
        text: 'Light',
        onPress: () => handleThemeChange('light'),
      },
      {
        text: 'Dark',
        onPress: () => handleThemeChange('dark'),
      },
      {
        text: 'System',
        onPress: () => handleThemeChange('system'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getThemeLabel = () => {
    const labels = { light: 'Light', dark: 'Dark', system: 'System' };
    return labels[theme];
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimePickerValue = () => {
    const [hours, minutes] = notificationTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date;
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View
        className="bg-white dark:bg-slate-800 px-4 pb-4 border-b border-slate-200 dark:border-slate-700"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your app
        </Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Premium Section */}
        {!premium && (
          <Card className="mt-4 bg-indigo-50 dark:bg-indigo-900/20">
            <TouchableOpacity
              onPress={() => router.push('/paywall')}
              className="flex-row items-center"
            >
              <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-3">
                <Ionicons name="diamond" size={24} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                  Go Premium
                </Text>
                <Text className="text-sm text-indigo-700 dark:text-indigo-300">
                  Remove ads & unlock exports
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#6366F1" />
            </TouchableOpacity>
          </Card>
        )}

        {premium && (
          <Card className="mt-4 bg-emerald-50 dark:bg-emerald-900/20">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                  Premium Active
                </Text>
                <Text className="text-sm text-emerald-700 dark:text-emerald-300">
                  All features unlocked
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Appearance */}
        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-6 mb-2 px-1">
          APPEARANCE
        </Text>
        <Card>
          <SettingRow
            icon="moon-outline"
            iconColor="#8B5CF6"
            title="Theme"
            subtitle={getThemeLabel()}
            onPress={showThemeOptions}
          />
        </Card>

        {/* Notifications */}
        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-6 mb-2 px-1">
          NOTIFICATIONS
        </Text>
        <Card>
          <SettingRow
            icon="notifications-outline"
            iconColor="#F59E0B"
            title="Daily Reminder"
            subtitle="Get reminded to log expenses"
            showArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                thumbColor={notificationsEnabled ? '#6366F1' : '#F1F5F9'}
              />
            }
          />
          {notificationsEnabled && (
            <>
              <View className="h-px bg-slate-100 dark:bg-slate-700 ml-13" />
              <SettingRow
                icon="time-outline"
                iconColor="#F59E0B"
                title="Reminder Time"
                subtitle={formatTime(notificationTime)}
                onPress={() => setShowTimePicker(true)}
              />
            </>
          )}
        </Card>

        {/* Data */}
        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-6 mb-2 px-1">
          DATA
        </Text>
        <Card>
          <SettingRow
            icon="download-outline"
            iconColor="#10B981"
            title="Export Data"
            subtitle={premium ? 'Export to CSV' : 'Premium feature'}
            onPress={showExportOptions}
          />
          <View className="h-px bg-slate-100 dark:bg-slate-700 ml-13" />
          <SettingRow
            icon="folder-outline"
            iconColor="#3B82F6"
            title="Manage Categories"
            subtitle="Add or edit expense categories"
            onPress={() => router.push('/category/manage')}
          />
        </Card>

        {/* About */}
        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-6 mb-2 px-1">
          ABOUT
        </Text>
        <Card className="mb-8">
          <SettingRow
            icon="information-circle-outline"
            iconColor="#6B7280"
            title="Version"
            subtitle="1.0.0"
            showArrow={false}
          />
          <View className="h-px bg-slate-100 dark:bg-slate-700 ml-13" />
          <SettingRow
            icon="shield-checkmark-outline"
            iconColor="#6B7280"
            title="Privacy"
            subtitle="Your data stays on your device"
            showArrow={false}
          />
        </Card>
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={getTimePickerValue()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}
