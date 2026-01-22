import { View, Text, Pressable, ScrollView, useColorScheme } from 'react-native';
import { AnalyticsTabType } from '@/src/types';

interface AnalyticsTabsProps {
  activeTab: AnalyticsTabType;
  onTabChange: (tab: AnalyticsTabType) => void;
}

interface TabConfig {
  id: AnalyticsTabType;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'all', label: 'All' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'income', label: 'Income' },
  { id: 'investments', label: 'Investments' },
];

export function AnalyticsTabs({ activeTab, onTabChange }: AnalyticsTabsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 16, marginHorizontal: -16, paddingHorizontal: 16 }}
      contentContainerStyle={{ paddingRight: 16 }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
          borderRadius: 12,
          padding: 4,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: isActive
                  ? isDark
                    ? '#334155'
                    : '#FFFFFF'
                  : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: isActive
                    ? isDark
                      ? '#FFFFFF'
                      : '#0F172A'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B',
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
