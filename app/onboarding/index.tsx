import { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { OnboardingSlide, ONBOARDING_SLIDES, SlideData } from '@/src/components/onboarding';
import { Button } from '@/src/components/ui';
import { setSetting } from '@/src/db';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<SlideData>>(null);

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await setSetting('hasCompletedOnboarding', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      // Navigate anyway
      router.replace('/(tabs)');
    }
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  const renderSlide = ({ item, index }: { item: SlideData; index: number }) => (
    <OnboardingSlide slide={item} index={index} />
  );

  return (
    <View
      className="flex-1 bg-white dark:bg-slate-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Skip Button */}
      {!isLastSlide && (
        <Animated.View
          entering={FadeIn.delay(500)}
          className="absolute top-0 right-0 z-10"
          style={{ paddingTop: insets.top + 12, paddingRight: 16 }}
        >
          <TouchableOpacity onPress={handleSkip} className="py-2 px-4">
            <Text className="text-slate-500 dark:text-slate-400 font-medium">
              Skip
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Bottom Section */}
      <Animated.View
        entering={FadeInDown.delay(600).duration(600)}
        className="px-6 pb-4"
      >
        {/* Pagination Dots */}
        <View className="flex-row justify-center mb-8">
          {ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${
                index === currentIndex
                  ? 'w-8 bg-indigo-500'
                  : 'w-2 bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </View>

        {/* Action Button */}
        {isLastSlide ? (
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            fullWidth
            icon="arrow-forward"
          />
        ) : (
          <Button title="Next" onPress={handleNext} fullWidth />
        )}
      </Animated.View>
    </View>
  );
}
