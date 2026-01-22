import { Stack } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';

export default function IncomeLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#F1F5F9' : '#1F2937',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="new"
        options={{
          title: 'Add Income',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Income Details',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
