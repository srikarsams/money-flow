import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UnifiedTransactionCard, MoneyFlowSummary, PeriodSelector } from '@/src/components/unified';
import {
  UnifiedTransaction,
  MoneyFlowSummary as MoneyFlowSummaryType,
  TransactionFilterType,
  AnalyticsPeriod,
} from '@/src/types';
import { getUnifiedTransactions, getMoneyFlowSummary } from '@/src/db/queries';
import { useTheme } from '@/src/hooks/useTheme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [summary, setSummary] = useState<MoneyFlowSummaryType>({
    totalIncome: 0,
    totalExpenses: 0,
    totalInvestments: 0,
    liquidSavings: 0,
    expensePercentage: 0,
    investmentPercentage: 0,
    savingsPercentage: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionFilterType>('all');
  const [period, setPeriod] = useState<AnalyticsPeriod>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getDateRange = () => {
    if (period === 'monthly') {
      const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-31`;
      return { startDate, endDate };
    } else {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      return { startDate, endDate };
    }
  };

  const loadData = async () => {
    try {
      setError(null);
      const { startDate, endDate } = getDateRange();

      const [transactionsData, summaryData] = await Promise.all([
        getUnifiedTransactions({
          startDate,
          endDate,
          filterType: filter,
          limit: 100,
        }),
        getMoneyFlowSummary(startDate, endDate),
      ]);

      setTransactions(transactionsData ?? []);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load transactions. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [filter, period, selectedMonth, selectedYear])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTransactionPress = (transaction: UnifiedTransaction) => {
    if (transaction.type === 'investment') {
      router.push(`/investment/${transaction.id}`);
    } else if (transaction.type === 'income') {
      router.push(`/income/${transaction.id}`);
    } else {
      router.push(`/expense/${transaction.id}`);
    }
  };

  const handleFABPress = () => {
    Alert.alert(
      'Add Transaction',
      'What would you like to add?',
      [
        { text: 'Income', onPress: () => router.push('/income/new') },
        { text: 'Expense', onPress: () => router.push('/expense/new') },
        { text: 'Investment', onPress: () => router.push('/investment/new') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const FilterButton = ({
    type,
    label,
  }: {
    type: TransactionFilterType;
    label: string;
  }) => (
    <TouchableOpacity
      onPress={() => setFilter(type)}
      className={`flex-1 py-2 rounded-lg ${
        filter === type ? 'bg-indigo-500' : 'bg-transparent'
      }`}
      activeOpacity={0.7}
    >
      <Text
        className={`text-center text-sm font-medium ${
          filter === type
            ? 'text-white'
            : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ListHeader = (
    <View className="mb-4">
      {/* Period Selector */}
      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      {/* Money Flow Summary */}
      <MoneyFlowSummary summary={summary} currencySymbol="$" />

      {/* Filter Toggle */}
      <View className="flex-row gap-1 mt-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <FilterButton type="all" label="All" />
        <FilterButton type="income" label="Income" />
        <FilterButton type="expense" label="Expenses" />
        <FilterButton type="investment" label="Inv" />
      </View>

      {/* Transactions Header */}
      <Text className="text-lg font-semibold text-slate-900 dark:text-white mt-6 mb-2">
        Transactions
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

  const renderTransaction = ({ item }: { item: UnifiedTransaction }) => (
    <UnifiedTransactionCard
      transaction={item}
      onPress={() => handleTransactionPress(item)}
      currencySymbol="$"
    />
  );

  const EmptyList = (
    <View className="items-center justify-center py-12">
      <Ionicons
        name="wallet-outline"
        size={48}
        color={colors.textSecondary}
      />
      <Text className="text-slate-500 dark:text-slate-400 mt-4 text-center">
        No transactions found
      </Text>
      <Text className="text-slate-400 dark:text-slate-500 text-sm mt-1 text-center">
        Tap the + button to add one
      </Text>
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
          Track your money
        </Text>
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!loading ? EmptyList : null}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#818cf8' : '#6366f1'}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleFABPress}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-500 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 8 }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
