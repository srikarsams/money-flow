import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button } from '@/src/components/ui';
import { purchasePremium, restorePurchases, getPremiumPrice } from '@/src/services/purchaseService';

const FEATURES = [
  {
    icon: 'ban-outline',
    title: 'Remove All Ads',
    description: 'Enjoy an ad-free experience throughout the app',
  },
  {
    icon: 'download-outline',
    title: 'Export to CSV',
    description: 'Export your expenses and investments to CSV files',
  },
  {
    icon: 'heart-outline',
    title: 'Support Development',
    description: 'Help us keep improving the app with new features',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const success = await purchasePremium();
      if (success) {
        Alert.alert(
          'Thank You!',
          'You now have access to all premium features.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Purchase Failed', 'Please try again later.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert(
          'Restored!',
          'Your purchase has been restored.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('No Purchase Found', 'No previous purchase was found to restore.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View
      className="flex-1 bg-white dark:bg-slate-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <View className="px-4 py-2">
        <Button
          title="Close"
          onPress={() => router.back()}
          variant="ghost"
          icon="close"
        />
      </View>

      <View className="flex-1 px-6 justify-center">
        {/* Icon */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(600)}
          className="items-center mb-6"
        >
          <View className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center">
            <Ionicons name="diamond" size={48} color="#6366F1" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(200).duration(600)}
          className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-2"
        >
          Go Premium
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(300).duration(600)}
          className="text-base text-slate-500 dark:text-slate-400 text-center mb-8"
        >
          One-time purchase. Unlock all features forever.
        </Animated.Text>

        {/* Features */}
        <View className="mb-8">
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeInDown.delay(400 + index * 100).duration(600)}
              className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-3"
            >
              <View className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-4">
                <Ionicons name={feature.icon as any} size={24} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900 dark:text-white">
                  {feature.title}
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {feature.description}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Price & Purchase */}
        <Animated.View entering={FadeInDown.delay(700).duration(600)}>
          <Button
            title={`Unlock Premium - ${getPremiumPrice()}`}
            onPress={handlePurchase}
            loading={purchasing}
            fullWidth
            icon="diamond"
          />

          <Button
            title="Restore Purchase"
            onPress={handleRestore}
            loading={restoring}
            variant="ghost"
            fullWidth
          />
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.Text
        entering={FadeInDown.delay(800).duration(600)}
        className="text-xs text-slate-400 dark:text-slate-500 text-center px-6 pb-4"
      >
        One-time purchase. No subscriptions. Your data stays on your device.
      </Animated.Text>
    </View>
  );
}
