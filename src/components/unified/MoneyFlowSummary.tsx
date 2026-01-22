import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MoneyFlowSummary as MoneyFlowSummaryType } from '@/src/types';

interface MoneyFlowSummaryProps {
  summary: MoneyFlowSummaryType;
  currencySymbol?: string;
}

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  prefix?: string;
  currencySymbol: string;
}

function SummaryCard({
  title,
  amount,
  icon,
  color,
  backgroundColor,
  prefix = '',
  currencySymbol,
}: SummaryCardProps) {
  const formatAmount = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return (absValue / 1000000).toFixed(1) + 'M';
    }
    if (absValue >= 1000) {
      return (absValue / 1000).toFixed(1) + 'K';
    }
    return absValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <View
      className="flex-1 rounded-2xl p-4"
      style={{ backgroundColor }}
    >
      <View className="flex-row items-center mb-2">
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: color + '30' }}
        >
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {title}
        </Text>
      </View>
      <Text
        className="text-lg font-bold"
        style={{ color }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {prefix}
        {currencySymbol}
        {formatAmount(amount)}
      </Text>
    </View>
  );
}

export function MoneyFlowSummary({
  summary,
  currencySymbol = '$',
}: MoneyFlowSummaryProps) {
  return (
    <View className="gap-3">
      {/* Top row: Income and Expenses */}
      <View className="flex-row gap-3">
        <SummaryCard
          title="Income"
          amount={summary.totalIncome}
          icon="arrow-down-circle"
          color="#22c55e"
          backgroundColor="rgba(34, 197, 94, 0.1)"
          prefix="+"
          currencySymbol={currencySymbol}
        />
        <SummaryCard
          title="Expenses"
          amount={summary.totalExpenses}
          icon="arrow-up-circle"
          color="#ef4444"
          backgroundColor="rgba(239, 68, 68, 0.1)"
          prefix="-"
          currencySymbol={currencySymbol}
        />
      </View>

      {/* Bottom row: Investments and Balance */}
      <View className="flex-row gap-3">
        <SummaryCard
          title="Investments"
          amount={summary.totalInvestments}
          icon="trending-up"
          color="#6366f1"
          backgroundColor="rgba(99, 102, 241, 0.1)"
          prefix="-"
          currencySymbol={currencySymbol}
        />
        <SummaryCard
          title="Balance"
          amount={summary.liquidSavings}
          icon="wallet"
          color={summary.liquidSavings >= 0 ? '#22c55e' : '#ef4444'}
          backgroundColor={
            summary.liquidSavings >= 0
              ? 'rgba(34, 197, 94, 0.1)'
              : 'rgba(239, 68, 68, 0.1)'
          }
          prefix={summary.liquidSavings >= 0 ? '+' : '-'}
          currencySymbol={currencySymbol}
        />
      </View>
    </View>
  );
}
