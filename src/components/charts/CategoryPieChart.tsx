import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { CategoryTotal } from '@/src/db/queries/analytics';
import { useTheme } from '@/src/hooks/useTheme';

interface CategoryPieChartProps {
  data: CategoryTotal[];
  totalAmount: number;
}

export function CategoryPieChart({ data, totalAmount }: CategoryPieChartProps) {
  const { isDark, colors } = useTheme();

  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Ionicons name="pie-chart-outline" size={48} color={colors.textSecondary} />
        <Text className="text-slate-500 dark:text-slate-400 mt-2">
          No expense data to display
        </Text>
      </View>
    );
  }

  const pieData = data.map((item) => ({
    value: item.total,
    color: item.categoryColor,
  }));

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
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
              <Text className="text-xs text-slate-500 dark:text-slate-400">Total</Text>
              <Text className="text-base font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalAmount)}
              </Text>
            </View>
          )}
          focusOnPress
        />
      </View>

      {/* Legend with percentages */}
      <View className="mt-6">
        {data.slice(0, 5).map((item) => (
          <View
            key={item.categoryId}
            className="flex-row items-center justify-between py-2"
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: item.categoryColor }}
              />
              <Text className="text-sm text-slate-700 dark:text-slate-300 flex-1" numberOfLines={1}>
                {item.categoryName}
              </Text>
            </View>
            <Text className="text-sm font-medium text-slate-900 dark:text-white ml-2">
              {item.percentage.toFixed(0)}%
            </Text>
          </View>
        ))}
        {data.length > 5 && (
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            +{data.length - 5} more categories
          </Text>
        )}
      </View>
    </View>
  );
}
