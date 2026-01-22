import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { IncomeAllocationItem } from '@/src/db/queries/unified';

interface AllocationPieChartProps {
  data: IncomeAllocationItem[];
  totalIncome: number;
  currencySymbol?: string;
}

export function AllocationPieChart({
  data,
  totalIncome,
  currencySymbol = '$',
}: AllocationPieChartProps) {
  const { isDark, colors } = useTheme();

  if (data.length === 0 || totalIncome === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Ionicons name="pie-chart-outline" size={48} color={colors.textSecondary} />
        <Text className="text-slate-500 dark:text-slate-400 mt-2">
          No income data to display
        </Text>
      </View>
    );
  }

  const pieData = data.map((item) => ({
    value: item.value,
    color: item.color,
  }));

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${currencySymbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${currencySymbol}${(amount / 1000).toFixed(1)}K`;
    }
    return `${currencySymbol}${amount.toFixed(0)}`;
  };

  const getIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    switch (name) {
      case 'Expenses':
        return 'arrow-up-circle';
      case 'Investments':
        return 'trending-up';
      case 'Savings':
        return 'wallet';
      default:
        return 'ellipse';
    }
  };

  return (
    <View>
      <View className="items-center">
        <PieChart
          data={pieData}
          donut
          radius={90}
          innerRadius={55}
          innerCircleColor={isDark ? '#1E293B' : '#FFFFFF'}
          centerLabelComponent={() => (
            <View className="items-center">
              <Text className="text-xs text-slate-500 dark:text-slate-400">Income</Text>
              <Text className="text-base font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalIncome)}
              </Text>
            </View>
          )}
          focusOnPress
        />
      </View>

      {/* Legend with icons and percentages */}
      <View className="mt-6">
        {data.map((item) => (
          <View
            key={item.name}
            className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700"
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: item.color + '20' }}
              >
                <Ionicons name={getIcon(item.name)} size={20} color={item.color} />
              </View>
              <View>
                <Text className="text-sm font-medium text-slate-900 dark:text-white">
                  {item.name}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {formatCurrency(item.value)}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text
                className="text-lg font-bold"
                style={{ color: item.color }}
              >
                {item.percentage.toFixed(0)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
