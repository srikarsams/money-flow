import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { initDatabase } from '@/src/db';
import { ErrorScreen } from '@/src/components/ui/ErrorScreen';

// Custom ErrorBoundary export for expo-router
export { ErrorBoundary } from '@/src/components/ErrorBoundary';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const initDB = async () => {
    try {
      setDbError(null);
      await initDatabase();
      setDbReady(true);
    } catch (e) {
      console.error('Failed to initialize database:', e);
      setDbError(e as Error);
      SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    initDB();
  }, []);

  useEffect(() => {
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbReady]);

  // Font loading error - show error inside navigation context
  if (error) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    );
  }

  // Database initialization error - show error inside navigation context
  if (dbError) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    );
  }

  // Still loading - must still return Stack to establish navigation context
  if (!loaded || !dbReady) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="expense" />
      <Stack.Screen name="income" />
      <Stack.Screen name="investment" />
      <Stack.Screen name="category" />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
