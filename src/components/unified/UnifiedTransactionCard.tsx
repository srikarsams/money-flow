import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UnifiedTransaction } from '@/src/types';
import { Card } from '../ui/Card';
import { getInvestmentTypeColor } from '../investment/InvestmentTypePicker';

interface UnifiedTransactionCardProps {
  transaction: UnifiedTransaction;
  onPress?: () => void;
  currencySymbol?: string;
}

export function UnifiedTransactionCard({
  transaction,
  onPress,
  currencySymbol = '$',
}: UnifiedTransactionCardProps) {
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

  const getIconAndColor = () => {
    if (transaction.type === 'investment') {
      const color = transaction.investmentType
        ? getInvestmentTypeColor(transaction.investmentType.name)
        : '#6366F1';
      return {
        icon: (transaction.investmentType?.icon as any) || 'trending-up',
        color,
      };
    }
    return {
      icon: (transaction.category?.icon as any) || 'ellipsis-horizontal',
      color: transaction.category?.color || '#6B7280',
    };
  };

  const getTitle = () => {
    if (transaction.type === 'investment') {
      return transaction.investmentName || 'Investment';
    }
    return transaction.title || transaction.category?.name || 'Uncategorized';
  };

  const getSubtitle = () => {
    if (transaction.type === 'investment') {
      return transaction.investmentType?.name || 'Other';
    }
    return transaction.title ? transaction.category?.name : undefined;
  };

  const getAmountStyle = () => {
    switch (transaction.type) {
      case 'income':
        return 'text-green-500 dark:text-green-400';
      case 'investment':
        return 'text-indigo-600 dark:text-indigo-400';
      default:
        return 'text-red-500 dark:text-red-400';
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'income':
        return '+';
      case 'investment':
        return ''; // Arrow icon used instead
      default:
        return '-';
    }
  };

  const { icon, color } = getIconAndColor();
  const subtitle = getSubtitle();

  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-center">
        {/* Icon */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: color + '20' }}
        >
          <Ionicons name={icon} size={24} color={color} />
        </View>

        {/* Details */}
        <View className="flex-1">
          <Text className="text-base font-medium text-slate-900 dark:text-white">
            {getTitle()}
          </Text>
          <View className="flex-row items-center mt-0.5">
            {subtitle && (
              <>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {subtitle}
                </Text>
                <Text className="text-slate-400 dark:text-slate-500 mx-1">
                  •
                </Text>
              </>
            )}
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {formatDate(transaction.date)}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <View className="items-end">
          <View className="flex-row items-center">
            {transaction.type === 'investment' && (
              <Ionicons
                name="arrow-forward"
                size={14}
                color="#6366F1"
                style={{ marginRight: 2 }}
              />
            )}
            <Text className={`text-base font-semibold ${getAmountStyle()}`}>
              {getAmountPrefix()}
              {currencySymbol}
              {formatAmount(transaction.amount)}
            </Text>
          </View>
          {transaction.imageUri && (
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
