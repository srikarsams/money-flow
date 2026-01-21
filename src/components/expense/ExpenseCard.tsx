import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense } from '@/src/types';
import { Card } from '../ui/Card';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
  currencySymbol?: string;
}

export function ExpenseCard({
  expense,
  onPress,
  currencySymbol = '$',
}: ExpenseCardProps) {
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

  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-center">
        {/* Category Icon */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{
            backgroundColor: (expense.category?.color || '#6B7280') + '20',
          }}
        >
          <Ionicons
            name={(expense.category?.icon as any) || 'ellipsis-horizontal'}
            size={24}
            color={expense.category?.color || '#6B7280'}
          />
        </View>

        {/* Details */}
        <View className="flex-1">
          <Text className="text-base font-medium text-slate-900 dark:text-white">
            {expense.title || expense.category?.name || 'Uncategorized'}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {expense.title ? expense.category?.name : formatDate(expense.date)}
            </Text>
            {expense.title && (
              <>
                <Text className="text-slate-400 dark:text-slate-500 mx-1">
                  •
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(expense.date)}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Amount */}
        <View className="items-end">
          <Text className="text-base font-semibold text-red-500 dark:text-red-400">
            -{currencySymbol}
            {formatAmount(expense.amount)}
          </Text>
          {expense.imageUri && (
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
