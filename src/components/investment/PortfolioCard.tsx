import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { PortfolioItem } from '@/src/db/queries/investments';
import { getInvestmentTypeColor } from './InvestmentTypePicker';

interface PortfolioCardProps {
  item: PortfolioItem;
  onPress?: () => void;
  onUpdateValue?: () => void;
  currencySymbol?: string;
}

export function PortfolioCard({
  item,
  onPress,
  onUpdateValue,
  currencySymbol = '$',
}: PortfolioCardProps) {
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return '--';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const typeColor = getInvestmentTypeColor(item.typeName);
  const hasValue = item.currentValue !== null;
  const isProfit = item.profit !== null && item.profit >= 0;

  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-start">
        {/* Type Icon */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: typeColor + '20' }}
        >
          <Ionicons name={item.typeIcon as any} size={24} color={typeColor} />
        </View>

        {/* Details */}
        <View className="flex-1">
          <Text className="text-base font-medium text-slate-900 dark:text-white">
            {item.name}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {item.typeName} • {item.transactionCount} transaction
            {item.transactionCount !== 1 ? 's' : ''}
          </Text>

          {/* Invested & Current Value */}
          <View className="flex-row mt-3 gap-4">
            <View>
              <Text className="text-xs text-slate-400 dark:text-slate-500">Invested</Text>
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {currencySymbol}
                {formatAmount(item.totalInvested)}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-slate-400 dark:text-slate-500">Current</Text>
              {hasValue ? (
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {currencySymbol}
                  {formatAmount(item.currentValue!)}
                </Text>
              ) : (
                <TouchableOpacity onPress={onUpdateValue}>
                  <Text className="text-sm text-indigo-500 dark:text-indigo-400">
                    Add value
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Profit/Loss */}
        <View className="items-end">
          {hasValue ? (
            <>
              <Text
                className={`text-base font-semibold ${
                  isProfit
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-red-500 dark:text-red-400'
                }`}
              >
                {isProfit ? '+' : ''}
                {currencySymbol}
                {formatAmount(Math.abs(item.profit!))}
              </Text>
              <Text
                className={`text-sm ${
                  isProfit
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-red-500 dark:text-red-400'
                }`}
              >
                {formatPercentage(item.profitPercentage)}
              </Text>
              {item.cagr !== null && (
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  CAGR: {formatPercentage(item.cagr)}
                </Text>
              )}
            </>
          ) : (
            <Text className="text-sm text-slate-400 dark:text-slate-500">
              No value set
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}
