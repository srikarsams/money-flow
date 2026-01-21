import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/src/components/ui';
import { CategoryPieChart, MonthlyBarChart, DailyBarChart } from '@/src/components/charts';
import { FilterSheet, FilterState, getDateRangeFromPreset } from '@/src/components/analytics';
import {
  getExpensesByCategory,
  getDailyTotals,
  getMonthlyTotals,
  getTotalExpenses,
  getAverageDaily,
  CategoryTotal,
  DailyTotal,
  MonthlyTotal,
} from '@/src/db/queries/analytics';
import { getAllCategories } from '@/src/db/queries/categories';
import { Category } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>(() => ({
    dateRange: 'this_month',
    categoryIds: [],
    ...getDateRangeFromPreset('this_month'),
  }));

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [totalExpenses, setTotalExpenses] = useState({ total: 0, count: 0 });
  const [averageDaily, setAverageDaily] = useState(0);

  const loadData = async () => {
    try {
      setError(null);

      const filterOptions = {
        startDate: filters.startDate ?? undefined,
        endDate: filters.endDate ?? undefined,
        categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
      };

      const [cats, catTotals, daily, monthly, totals, avgDaily] = await Promise.all([
        getAllCategories(),
        getExpensesByCategory({
          startDate: filterOptions.startDate,
          endDate: filterOptions.endDate,
        }),
        getDailyTotals({ ...filterOptions, limit: 14 }),
        getMonthlyTotals({ ...filterOptions, limit: 12 }),
        getTotalExpenses(filterOptions),
        getAverageDaily(filterOptions),
      ]);

      setCategories(cats);

      // Filter category totals if specific categories selected
      if (filters.categoryIds.length > 0) {
        setCategoryTotals(catTotals.filter((c) => filters.categoryIds.includes(c.categoryId)));
      } else {
        setCategoryTotals(catTotals);
      }

      setDailyTotals(daily);
      setMonthlyTotals(monthly);
      setTotalExpenses(totals);
      setAverageDaily(avgDaily);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [filters])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getDateRangeLabel = () => {
    const labels: Record<string, string> = {
      this_week: 'This Week',
      this_month: 'This Month',
      last_month: 'Last Month',
      last_3_months: 'Last 3 Months',
      this_year: 'This Year',
      all_time: 'All Time',
    };
    return labels[filters.dateRange] || 'Custom';
  };

  const activeFiltersCount =
    (filters.dateRange !== 'this_month' ? 1 : 0) +
    (filters.categoryIds.length > 0 ? 1 : 0);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View
        className="bg-white dark:bg-slate-800 px-4 pb-4 border-b border-slate-200 dark:border-slate-700"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
              Analytics
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {getDateRangeLabel()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="relative bg-slate-100 dark:bg-slate-700 p-2 rounded-lg"
          >
            <Ionicons name="filter" size={24} color={colors.text} />
            {activeFiltersCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-indigo-500 w-5 h-5 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Error Message */}
        {error && (
          <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mt-4">
            <Text className="text-red-600 dark:text-red-400 text-center">{error}</Text>
          </View>
        )}

        {/* Summary Cards */}
        <View className="flex-row gap-3 mt-4">
          <Card className="flex-1">
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Total Spent
            </Text>
            <Text className="text-lg font-bold text-red-500 dark:text-red-400">
              ${formatCurrency(totalExpenses.total)}
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {totalExpenses.count} expenses
            </Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Daily Average
            </Text>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              ${formatCurrency(averageDaily)}
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              per day
            </Text>
          </Card>
        </View>

        {/* Category Breakdown */}
        <Card className="mt-4">
          <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            By Category
          </Text>
          <CategoryPieChart data={categoryTotals} totalAmount={totalExpenses.total} />
        </Card>

        {/* Daily Spending */}
        <Card className="mt-4">
          <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Daily Spending
          </Text>
          <DailyBarChart data={dailyTotals} />
        </Card>

        {/* Monthly Trend */}
        <Card className="mt-4">
          <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Monthly Trend
          </Text>
          <MonthlyBarChart data={monthlyTotals} />
        </Card>

        {/* Category List */}
        {categoryTotals.length > 0 && (
          <Card className="mt-4 mb-8">
            <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Top Categories
            </Text>
            {categoryTotals.slice(0, 5).map((cat, index) => (
              <View
                key={cat.categoryId}
                className={`flex-row items-center justify-between py-3 ${
                  index > 0 ? 'border-t border-slate-100 dark:border-slate-700' : ''
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: cat.categoryColor + '20' }}
                  >
                    <Ionicons
                      name={cat.categoryIcon as any}
                      size={20}
                      color={cat.categoryColor}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-900 dark:text-white">
                      {cat.categoryName}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">
                      {cat.count} expense{cat.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-semibold text-red-500 dark:text-red-400">
                    ${formatCurrency(cat.total)}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {cat.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Filter Sheet */}
      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
        categories={categories}
      />
    </View>
  );
}
