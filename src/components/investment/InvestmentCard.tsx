import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Investment } from '@/src/types';
import { Card } from '../ui/Card';
import { getInvestmentTypeColor } from './InvestmentTypePicker';

interface InvestmentCardProps {
  investment: Investment;
  onPress?: () => void;
  currencySymbol?: string;
}

export function InvestmentCard({
  investment,
  onPress,
  currencySymbol = '$',
}: InvestmentCardProps) {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const typeColor = investment.type
    ? getInvestmentTypeColor(investment.type.name)
    : '#6366F1';

  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-center">
        {/* Type Icon */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: typeColor + '20' }}
        >
          <Ionicons
            name={(investment.type?.icon as any) || 'cube'}
            size={24}
            color={typeColor}
          />
        </View>

        {/* Details */}
        <View className="flex-1">
          <Text className="text-base font-medium text-slate-900 dark:text-white">
            {investment.name}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {investment.type?.name || 'Other'}
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 mx-1">•</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {formatDate(investment.date)}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <View className="items-end">
          <Text className="text-base font-semibold text-indigo-600 dark:text-indigo-400">
            {currencySymbol}
            {formatAmount(investment.amount)}
          </Text>
          {investment.imageUri && (
            <Ionicons
              name="image-outline"
              size={14}
              color="#94A3B8"
              style={{ marginTop: 4 }}
            />
          )}
        </View>
      </View>
    </Card>
  );
}
