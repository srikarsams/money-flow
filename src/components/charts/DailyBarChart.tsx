import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { DailyTotal } from '@/src/db/queries/analytics';
import { useTheme } from '@/src/hooks/useTheme';
import { format, parseISO } from 'date-fns';

interface DailyBarChartProps {
  data: DailyTotal[];
}

export function DailyBarChart({ data }: DailyBarChartProps) {
  const { isDark, colors } = useTheme();

  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
        <Text className="text-slate-500 dark:text-slate-400 mt-2">
          No daily data to display
        </Text>
      </View>
    );
  }

  // Reverse to show oldest to newest (left to right)
  const sortedData = [...data].reverse();

  const barData = sortedData.map((item) => ({
    value: item.total,
    label: format(parseISO(item.date), 'd'),
    frontColor: colors.expense,
  }));

  const maxValue = Math.max(...data.map((d) => d.total));

  return (
    <View>
      <BarChart
        data={barData}
        barWidth={20}
        spacing={8}
        roundedTop
        hideRules
        xAxisThickness={1}
        yAxisThickness={0}
        xAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
        noOfSections={4}
        maxValue={maxValue * 1.2 || 100}
        isAnimated
        animationDuration={500}
      />
    </View>
  );
}
