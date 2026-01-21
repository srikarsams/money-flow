import { useColorScheme } from 'react-native';

// Color definitions for light and dark modes
const colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    primary: '#6366F1',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    expense: '#EF4444',
    profit: '#10B981',
    investment: '#6366F1',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    primary: '#818CF8',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
    expense: '#F87171',
    profit: '#34D399',
    investment: '#818CF8',
  },
};

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors: isDark ? colors.dark : colors.light,
  };
}

export function useThemeColor(
  colorName: keyof typeof colors.light
): string {
  const { colors: themeColors } = useTheme();
  return themeColors[colorName];
}
