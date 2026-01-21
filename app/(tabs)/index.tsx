import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseList } from '@/src/components/expense/ExpenseList';
import { Card, Button } from '@/src/components/ui';
import { Expense } from '@/src/types';
import { getRecentExpenses, getTodayTotal, getMonthTotal } from '@/src/db/queries/expenses';
import { useTheme } from '@/src/hooks/useTheme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const [recentExpenses, today, month] = await Promise.all([
        getRecentExpenses(50),
        getTodayTotal(),
        getMonthTotal(new Date().getFullYear(), new Date().getMonth() + 1),
      ]);
      setExpenses(recentExpenses ?? []);
      setTodayTotal(today ?? 0);
      setMonthTotal(month ?? 0);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load expenses. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleExpensePress = (expense: Expense) => {
    router.push(`/expense/${expense.id}`);
  };

  const handleAddExpense = () => {
    router.push('/expense/new');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });

  const ListHeader = (
    <View className="mb-6">
      {/* Summary Cards */}
      <View className="flex-row gap-3 mt-4">
        <Card className="flex-1">
          <Text className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Today
          </Text>
          <Text className="text-xl font-bold text-red-500 dark:text-red-400">
            ${formatCurrency(todayTotal)}
          </Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            {currentMonth}
          </Text>
          <Text className="text-xl font-bold text-red-500 dark:text-red-400">
            ${formatCurrency(monthTotal)}
          </Text>
        </Card>
      </View>

      {/* Recent Transactions Header */}
      <Text className="text-lg font-semibold text-slate-900 dark:text-white mt-6 mb-2">
        Recent Transactions
      </Text>

      {/* Error Message */}
      {error && (
        <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4">
          <Text className="text-red-600 dark:text-red-400 text-center">
            {error}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View
        className="bg-white dark:bg-slate-800 px-4 pb-4 border-b border-slate-200 dark:border-slate-700"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Money Flow
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track your expenses
        </Text>
      </View>

      {/* Expense List */}
      <ExpenseList
        expenses={expenses}
        onExpensePress={handleExpensePress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListHeaderComponent={ListHeader}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleAddExpense}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-500 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 8 }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
