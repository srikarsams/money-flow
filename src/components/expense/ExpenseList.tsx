import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Expense } from '@/src/types';
import { ExpenseCard } from './ExpenseCard';

interface ExpenseListProps {
  expenses: Expense[];
  onExpensePress?: (expense: Expense) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  currencySymbol?: string;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}

export function ExpenseList({
  expenses,
  onExpensePress,
  onRefresh,
  refreshing = false,
  currencySymbol = '$',
  ListHeaderComponent,
  ListEmptyComponent,
}: ExpenseListProps) {
  const groupExpensesByDate = (expenses: Expense[]) => {
    const groups: { [date: string]: Expense[] } = {};

    expenses.forEach((expense) => {
      if (!groups[expense.date]) {
        groups[expense.date] = [];
      }
      groups[expense.date].push(expense);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      data: items,
      total: items.reduce((sum, e) => sum + e.amount, 0),
    }));
  };

  const formatDateHeader = (dateStr: string) => {
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
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const groupedExpenses = groupExpensesByDate(expenses);

  const renderItem = ({ item }: { item: typeof groupedExpenses[0] }) => (
    <View className="mb-4">
      {/* Date Header */}
      <View className="flex-row justify-between items-center mb-2 px-1">
        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {formatDateHeader(item.date)}
        </Text>
        <Text className="text-sm font-medium text-red-500 dark:text-red-400">
          -{currencySymbol}
          {item.total.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>

      {/* Expenses for this date */}
      {item.data.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onPress={() => onExpensePress?.(expense)}
          currencySymbol={currencySymbol}
        />
      ))}
    </View>
  );

  const defaultEmptyComponent = (
    <View className="flex-1 items-center justify-center py-12">
      <Text className="text-slate-400 dark:text-slate-500 text-base">
        No expenses yet
      </Text>
      <Text className="text-slate-400 dark:text-slate-500 text-sm mt-1">
        Tap + to add your first expense
      </Text>
    </View>
  );

  return (
    <FlatList
      data={groupedExpenses}
      renderItem={renderItem}
      keyExtractor={(item) => item.date}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent || defaultEmptyComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    />
  );
}
