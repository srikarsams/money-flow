import { View, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export interface SlideData {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  description: string;
}

interface OnboardingSlideProps {
  slide: SlideData;
  index: number;
}

export function OnboardingSlide({ slide, index }: OnboardingSlideProps) {
  return (
    <View className="flex-1 items-center justify-center px-8" style={{ width }}>
      <Animated.View
        entering={FadeInUp.delay(100).duration(600)}
        className="w-32 h-32 rounded-full items-center justify-center mb-8"
        style={{ backgroundColor: slide.iconColor + '20' }}
      >
        <Ionicons name={slide.icon as any} size={64} color={slide.iconColor} />
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(200).duration(600)}
        className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-3"
      >
        {slide.title}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(300).duration(600)}
        className="text-lg text-indigo-600 dark:text-indigo-400 text-center mb-4 font-medium"
      >
        {slide.subtitle}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(400).duration(600)}
        className="text-base text-slate-500 dark:text-slate-400 text-center leading-6"
      >
        {slide.description}
      </Animated.Text>
    </View>
  );
}

export const ONBOARDING_SLIDES: SlideData[] = [
  {
    icon: 'wallet-outline',
    iconColor: '#6366F1',
    title: 'Money Flow',
    subtitle: 'Track Your Expenses, Build Your Wealth',
    description:
      'A simple, beautiful app to track your daily expenses and investments. All your financial data in one place.',
  },
  {
    icon: 'flash-outline',
    iconColor: '#10B981',
    title: 'Quick & Easy',
    subtitle: 'Log in Seconds',
    description:
      'Add expenses with just a few taps. Categorize automatically, attach receipts, and never lose track of where your money goes.',
  },
  {
    icon: 'bar-chart-outline',
    iconColor: '#F59E0B',
    title: 'Smart Insights',
    subtitle: 'Understand Your Money',
    description:
      'Beautiful charts and analytics help you understand your spending patterns. See daily, weekly, and monthly trends at a glance.',
  },
  {
    icon: 'shield-checkmark-outline',
    iconColor: '#EF4444',
    title: '100% Private',
    subtitle: 'Your Data Stays on Your Device',
    description:
      'No accounts, no cloud sync, no data collection. Your financial information never leaves your phone. Complete privacy guaranteed.',
  },
];
