import { Stack, useRouter } from 'expo-router';
import { ErrorScreen } from '@/src/components/ui/ErrorScreen';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: false }} />
      <ErrorScreen
        title="Page Not Found"
        message="The page you're looking for doesn't exist or has been moved."
        onRetry={() => router.back()}
        onGoHome={() => router.replace('/')}
        showHomeButton
      />
    </>
  );
}
