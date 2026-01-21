import { View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
        Settings
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 mt-2">
        Customize your app
      </Text>
    </View>
  );
}
