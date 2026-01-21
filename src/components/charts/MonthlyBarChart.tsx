import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { MonthlyTotal } from '@/src/db/queries/analytics';
import { useTheme } from '@/src/hooks/useTheme';

interface MonthlyBarChartProps {
  data: MonthlyTotal[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const { isDark, colors } = useTheme();

  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
        <Text className="text-slate-500 dark:text-slate-400 mt-2">
          No monthly data to display
        </Text>
      </View>
    );
  }

  // Reverse to show oldest to newest (left to right)
  const sortedData = [...data].reverse();

  const barData = sortedData.map((item) => ({
    value: item.total,
    label: MONTH_NAMES[item.month - 1],
    frontColor: colors.expense,
    topLabelComponent: () => (
      <Text className="text-[8px] text-slate-500 dark:text-slate-400 mb-1">
        {item.total >= 1000 ? `${(item.total / 1000).toFixed(1)}k` : item.total.toFixed(0)}
      </Text>
    ),
  }));

  const maxValue = Math.max(...data.map((d) => d.total));

  return (
    <View>
      <BarChart
        data={barData}
        barWidth={28}
        spacing={16}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={1}
        yAxisThickness={0}
        xAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        noOfSections={4}
        maxValue={maxValue * 1.2}
        isAnimated
        animationDuration={500}
      />
    </View>
  );
}
