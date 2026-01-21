import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
}

export function ErrorScreen({
  title = 'Something went wrong',
  message = "We're sorry, an unexpected error occurred. Your data is safe.",
  onRetry,
  onGoHome,
  showHomeButton = false,
}: ErrorScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-white dark:bg-slate-900 items-center justify-center px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Sad Face Icon */}
      <View className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
        <Ionicons
          name="sad-outline"
          size={48}
          color="#94A3B8"
        />
      </View>

      {/* Title */}
      <Text className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-3">
        {title}
      </Text>

      {/* Message */}
      <Text className="text-base text-slate-500 dark:text-slate-400 text-center mb-8 leading-6">
        {message}
      </Text>

      {/* Actions */}
      <View className="w-full gap-3">
        {onRetry && (
          <Button
            title="Try Again"
            onPress={onRetry}
            fullWidth
            icon="refresh-outline"
          />
        )}
        {showHomeButton && onGoHome && (
          <Button
            title="Go to Home"
            onPress={onGoHome}
            variant="secondary"
            fullWidth
            icon="home-outline"
          />
        )}
      </View>
    </View>
  );
}
