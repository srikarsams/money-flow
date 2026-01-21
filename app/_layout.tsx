import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { initDatabase } from '@/src/db';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
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
      // Still hide splash screen so user sees the error
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

  // Font loading error
  if (error) {
    return (
      <ErrorScreen
        title="Failed to Load"
        message="The app couldn't load properly. Please restart the app."
        onRetry={() => {
          // Reload the app
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    );
  }

  // Database initialization error
  if (dbError) {
    return (
      <ErrorScreen
        title="Database Error"
        message="Failed to initialize the database. Your data may not be accessible. Please try again."
        onRetry={initDB}
      />
    );
  }

  // Still loading
  if (!loaded || !dbReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <RootLayoutNav />
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="expense" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
