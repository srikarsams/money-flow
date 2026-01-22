import { Stack } from 'expo-router';

export default function InvestmentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="portfolio/[name]" />
    </Stack>
  );
}
