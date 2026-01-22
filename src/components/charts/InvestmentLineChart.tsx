import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';

interface ChartDataPoint {
  date: string;
  value: number;
}

interface InvestmentLineChartProps {
  data: ChartDataPoint[];
  title?: string;
  color?: string;
  height?: number;
  showArea?: boolean;
  emptyMessage?: string;
}

export function InvestmentLineChart({
  data,
  title,
  color,
  height = 180,
  showArea = true,
  emptyMessage = 'No value history to display',
}: InvestmentLineChartProps) {
  const { isDark, colors } = useTheme();

  const chartColor = color ?? colors.primary;

  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Ionicons name="analytics-outline" size={48} color={colors.textSecondary} />
        <Text className="text-slate-500 dark:text-slate-400 mt-2 text-center">
          {emptyMessage}
        </Text>
      </View>
    );
  }

  // Sort data by date (oldest to newest)
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Format date labels
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Map to chart format
  const chartData = sortedData.map((item, index) => ({
    value: item.value,
    label: index === 0 || index === sortedData.length - 1 ? formatDateLabel(item.date) : '',
    dataPointText: '',
  }));

  // Calculate min/max for better visualization
  const values = sortedData.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const yAxisMin = range > 0 ? Math.max(0, minValue - range * 0.1) : 0;
  const yAxisMax = range > 0 ? maxValue + range * 0.1 : maxValue * 1.1;

  // Format currency for y-axis
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  return (
    <View>
      {title && (
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          {title}
        </Text>
      )}
      <LineChart
        data={chartData}
        height={height}
        curved
        hideDataPoints={data.length > 10}
        dataPointsRadius={4}
        dataPointsColor={chartColor}
        color={chartColor}
        thickness={2}
        startFillColor={showArea ? chartColor + '40' : 'transparent'}
        endFillColor={showArea ? chartColor + '10' : 'transparent'}
        startOpacity={showArea ? 0.4 : 0}
        endOpacity={showArea ? 0.1 : 0}
        areaChart={showArea}
        hideRules
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        noOfSections={4}
        yAxisOffset={yAxisMin}
        maxValue={yAxisMax - yAxisMin}
        formatYLabel={(value) => formatYAxis(parseFloat(value) + yAxisMin)}
        isAnimated
        animationDuration={500}
        spacing={data.length > 1 ? Math.max(20, 280 / (data.length - 1)) : 100}
        initialSpacing={10}
        endSpacing={10}
      />
    </View>
  );
}
