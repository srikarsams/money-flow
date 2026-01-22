import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card, Modal, Button } from '@/src/components/ui';
import {
  CategoryPieChart,
  MonthlyBarChart,
  DailyBarChart,
  AllocationPieChart,
  InvestmentLineChart,
} from '@/src/components/charts';
import { AnalyticsTabs } from '@/src/components/analytics';
import { PeriodSelector } from '@/src/components/unified';
import {
  PortfolioCard,
  UpdateValueModal,
  getInvestmentTypeColor,
} from '@/src/components/investment';
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
import {
  getIncomeAllocationBreakdown,
  getMoneyFlowSummary,
  IncomeAllocationItem,
} from '@/src/db/queries/unified';
import {
  getPortfolioSummary,
  setCurrentValue,
  getPortfolioValueHistory,
  PortfolioSummary,
  PortfolioItem,
} from '@/src/db/queries/investments';
import { getAllInvestmentTypes } from '@/src/db/queries/investment-types';
import { AnalyticsTabType, AnalyticsPeriod, InvestmentTypeItem, MoneyFlowSummary } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const [activeTab, setActiveTab] = useState<AnalyticsTabType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Period state
  const [period, setPeriod] = useState<AnalyticsPeriod>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // All tab data
  const [flowSummary, setFlowSummary] = useState<MoneyFlowSummary | null>(null);
  const [allocationData, setAllocationData] = useState<IncomeAllocationItem[]>([]);

  // Expense/Income tab data
  const [expenseCategoryTotals, setExpenseCategoryTotals] = useState<CategoryTotal[]>([]);
  const [incomeCategoryTotals, setIncomeCategoryTotals] = useState<CategoryTotal[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [expenseStats, setExpenseStats] = useState({ total: 0, count: 0 });
  const [incomeStats, setIncomeStats] = useState({ total: 0, count: 0 });
  const [expenseAvgDaily, setExpenseAvgDaily] = useState(0);
  const [incomeAvgDaily, setIncomeAvgDaily] = useState(0);

  // Investment tab data
  const [portfolio, setPortfolio] = useState<PortfolioSummary>({
    totalInvested: 0,
    totalCurrentValue: 0,
    totalProfit: 0,
    totalProfitPercentage: 0,
    items: [],
  });
  const [portfolioValueHistory, setPortfolioValueHistory] = useState<{ date: string; totalValue: number }[]>([]);
  const [investmentTypes, setInvestmentTypes] = useState<InvestmentTypeItem[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [showTypeFilters, setShowTypeFilters] = useState(false);
  const [updateValueItem, setUpdateValueItem] = useState<PortfolioItem | null>(null);
  const [updatingValue, setUpdatingValue] = useState(false);

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

      // Load data based on active tab
      if (activeTab === 'all') {
        const [summaryData, allocationBreakdown] = await Promise.all([
          getMoneyFlowSummary(startDate, endDate),
          getIncomeAllocationBreakdown(startDate, endDate),
        ]);
        setFlowSummary(summaryData);
        setAllocationData(allocationBreakdown);
      } else if (activeTab === 'expenses') {
        const [catTotals, daily, monthly, totals, avgDaily] = await Promise.all([
          getExpensesByCategory({ startDate, endDate, type: 'expense' }),
          getDailyTotals({ startDate, endDate, type: 'expense', limit: 14 }),
          getMonthlyTotals({ type: 'expense', limit: 12 }),
          getTotalExpenses({ startDate, endDate, type: 'expense' }),
          getAverageDaily({ startDate, endDate, type: 'expense' }),
        ]);
        setExpenseCategoryTotals(catTotals);
        setDailyTotals(daily);
        setMonthlyTotals(monthly);
        setExpenseStats(totals);
        setExpenseAvgDaily(avgDaily);
      } else if (activeTab === 'income') {
        const [catTotals, daily, monthly, totals, avgDaily] = await Promise.all([
          getExpensesByCategory({ startDate, endDate, type: 'income' }),
          getDailyTotals({ startDate, endDate, type: 'income', limit: 14 }),
          getMonthlyTotals({ type: 'income', limit: 12 }),
          getTotalExpenses({ startDate, endDate, type: 'income' }),
          getAverageDaily({ startDate, endDate, type: 'income' }),
        ]);
        setIncomeCategoryTotals(catTotals);
        setDailyTotals(daily);
        setMonthlyTotals(monthly);
        setIncomeStats(totals);
        setIncomeAvgDaily(avgDaily);
      } else if (activeTab === 'investments') {
        const filterOptions = selectedTypeId ? { typeId: selectedTypeId } : undefined;
        const [portfolioData, typesData, valueHistory] = await Promise.all([
          getPortfolioSummary(filterOptions),
          getAllInvestmentTypes(),
          getPortfolioValueHistory(30),
        ]);
        setPortfolio(portfolioData);
        setInvestmentTypes(typesData);
        setPortfolioValueHistory(valueHistory);
      }
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
    }, [activeTab, period, selectedMonth, selectedYear, selectedTypeId])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpdateValue = async (value: number) => {
    if (!updateValueItem) return;
    setUpdatingValue(true);
    try {
      await setCurrentValue(updateValueItem.name, value);
      setUpdateValueItem(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update value:', err);
    } finally {
      setUpdatingValue(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const hasValue = portfolio.totalCurrentValue > 0;
  const isProfit = portfolio.totalProfit >= 0;
  const selectedType = investmentTypes.find((t) => t.id === selectedTypeId);

  // Render different content based on active tab
  const renderContent = () => {
    if (activeTab === 'all') {
      return renderAllTab();
    } else if (activeTab === 'expenses') {
      return renderExpensesTab();
    } else if (activeTab === 'income') {
      return renderIncomeTab();
    } else {
      return renderInvestmentsTab();
    }
  };

  const renderAllTab = () => (
    <>
      {/* Summary Cards */}
      {flowSummary && (
        <View className="flex-row gap-3 mt-4">
          <Card className="flex-1">
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Total Income
            </Text>
            <Text className="text-lg font-bold text-green-500 dark:text-green-400">
              +${formatCurrency(flowSummary.totalIncome)}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Balance
            </Text>
            <Text
              className={`text-lg font-bold ${
                flowSummary.liquidSavings >= 0
                  ? 'text-green-500 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400'
              }`}
            >
              {flowSummary.liquidSavings >= 0 ? '+' : '-'}$
              {formatCurrency(Math.abs(flowSummary.liquidSavings))}
            </Text>
          </Card>
        </View>
      )}

      {/* Income Allocation Pie */}
      <Card className="mt-4">
        <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Where Income Went
        </Text>
        <AllocationPieChart
          data={allocationData}
          totalIncome={flowSummary?.totalIncome ?? 0}
          currencySymbol="$"
        />
      </Card>
    </>
  );

  const renderExpensesTab = () => (
    <>
      {/* Summary Cards */}
      <View className="flex-row gap-3 mt-4">
        <Card className="flex-1">
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Total Spent
          </Text>
          <Text className="text-lg font-bold text-red-500 dark:text-red-400">
            ${formatCurrency(expenseStats.total)}
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {expenseStats.count} expenses
          </Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Daily Average
          </Text>
          <Text className="text-lg font-bold text-slate-900 dark:text-white">
            ${formatCurrency(expenseAvgDaily)}
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
        <CategoryPieChart data={expenseCategoryTotals} totalAmount={expenseStats.total} />
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

      {/* Top Categories */}
      {expenseCategoryTotals.length > 0 && (
        <Card className="mt-4">
          <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Top Categories
          </Text>
          {expenseCategoryTotals.slice(0, 5).map((cat, index) => (
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
                  <Ionicons name={cat.categoryIcon as any} size={20} color={cat.categoryColor} />
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
    </>
  );

  const renderIncomeTab = () => (
    <>
      {/* Summary Cards */}
      <View className="flex-row gap-3 mt-4">
        <Card className="flex-1">
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Total Income
          </Text>
          <Text className="text-lg font-bold text-green-500 dark:text-green-400">
            +${formatCurrency(incomeStats.total)}
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {incomeStats.count} entries
          </Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Daily Average
          </Text>
          <Text className="text-lg font-bold text-slate-900 dark:text-white">
            ${formatCurrency(incomeAvgDaily)}
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            per day
          </Text>
        </Card>
      </View>

      {/* Income by Source */}
      <Card className="mt-4">
        <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Income Sources
        </Text>
        <CategoryPieChart data={incomeCategoryTotals} totalAmount={incomeStats.total} />
      </Card>

      {/* Daily Income */}
      <Card className="mt-4">
        <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Daily Income
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

      {/* Top Sources */}
      {incomeCategoryTotals.length > 0 && (
        <Card className="mt-4">
          <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Top Sources
          </Text>
          {incomeCategoryTotals.slice(0, 5).map((cat, index) => (
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
                  <Ionicons name={cat.categoryIcon as any} size={20} color={cat.categoryColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-slate-900 dark:text-white">
                    {cat.categoryName}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {cat.count} entr{cat.count !== 1 ? 'ies' : 'y'}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm font-semibold text-green-500 dark:text-green-400">
                  +${formatCurrency(cat.total)}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {cat.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </>
  );

  const renderInvestmentsTab = () => (
    <>
      {/* Filter Button */}
      <View className="flex-row items-center justify-between mt-4 mb-2">
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          {selectedType ? selectedType.name : 'All Types'}
        </Text>
        <TouchableOpacity
          onPress={() => setShowTypeFilters(true)}
          className="flex-row items-center bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg"
        >
          <Ionicons name="filter" size={16} color={colors.textSecondary} />
          <Text className="text-sm text-slate-600 dark:text-slate-300 ml-1">Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Portfolio Summary Cards */}
      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Total Invested
          </Text>
          <Text className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            ${formatCurrency(portfolio.totalInvested)}
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {portfolio.items.length} investment{portfolio.items.length !== 1 ? 's' : ''}
          </Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            {hasValue ? 'Total Profit' : 'Current Value'}
          </Text>
          {hasValue ? (
            <>
              <Text
                className={`text-lg font-bold ${
                  isProfit
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-red-500 dark:text-red-400'
                }`}
              >
                {isProfit ? '+' : ''}${formatCurrency(portfolio.totalProfit)}
              </Text>
              <Text
                className={`text-xs mt-1 ${
                  isProfit
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-red-500 dark:text-red-400'
                }`}
              >
                {formatPercentage(portfolio.totalProfitPercentage)}
              </Text>
            </>
          ) : (
            <Text className="text-lg font-bold text-slate-400 dark:text-slate-500">--</Text>
          )}
        </Card>
      </View>

      {/* Portfolio Value Chart */}
      {portfolioValueHistory.length > 0 && (
        <Card className="mt-4">
          <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
            Portfolio Value
          </Text>
          <InvestmentLineChart
            data={portfolioValueHistory.map((item) => ({
              date: item.date,
              value: item.totalValue,
            }))}
            height={160}
            color={colors.primary}
          />
        </Card>
      )}

      {/* Portfolio Items */}
      <View className="mt-4">
        {portfolio.items.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons
              name="trending-up-outline"
              size={64}
              color={isDark ? '#475569' : '#CBD5E1'}
            />
            <Text className="text-slate-500 dark:text-slate-400 mt-4 text-center">
              No investments yet
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-sm text-center mt-1">
              Add investments from the home screen
            </Text>
          </View>
        ) : (
          portfolio.items.map((item) => (
            <PortfolioCard
              key={item.name}
              item={item}
              onPress={() => router.push(`/investment/portfolio/${encodeURIComponent(item.name)}`)}
              onUpdateValue={() => setUpdateValueItem(item)}
            />
          ))
        )}
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View
        className="bg-white dark:bg-slate-800 px-4 pb-4 border-b border-slate-200 dark:border-slate-700"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Analytics
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Insights & trends
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#818cf8' : '#6366f1'}
          />
        }
      >
        {/* Period Selector (not for investments tab) */}
        {activeTab !== 'investments' && (
          <View className="mt-4">
            <PeriodSelector
              period={period}
              onPeriodChange={setPeriod}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </View>
        )}

        {/* Analytics Tabs */}
        <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Error Message */}
        {error && (
          <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
            <Text className="text-red-600 dark:text-red-400 text-center">{error}</Text>
          </View>
        )}

        {/* Tab Content */}
        {renderContent()}

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Investment Type Filter Modal */}
      <Modal
        visible={showTypeFilters}
        onClose={() => setShowTypeFilters(false)}
        title="Filter by Type"
      >
        <View className="mb-6">
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              onPress={() => setSelectedTypeId(null)}
              className={`px-3 py-2 rounded-lg ${
                selectedTypeId === null ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-700'
              }`}
            >
              <Text
                className={`text-sm ${
                  selectedTypeId === null
                    ? 'text-white font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                All Types
              </Text>
            </TouchableOpacity>
            {investmentTypes.map((type) => {
              const isSelected = selectedTypeId === type.id;
              const color = getInvestmentTypeColor(type.name);
              return (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setSelectedTypeId(type.id)}
                  className={`flex-row items-center px-3 py-2 rounded-lg ${
                    isSelected ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-700'
                  }`}
                >
                  <Ionicons name={type.icon as any} size={16} color={isSelected ? '#FFFFFF' : color} />
                  <Text
                    className={`text-sm ml-2 ${
                      isSelected ? 'text-white font-medium' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <View className="flex-1">
            <Button
              variant="secondary"
              onPress={() => setSelectedTypeId(null)}
              title="Reset"
              fullWidth
            />
          </View>
          <View className="flex-1">
            <Button onPress={() => setShowTypeFilters(false)} title="Apply" fullWidth />
          </View>
        </View>
      </Modal>

      {/* Update Value Modal */}
      <UpdateValueModal
        visible={updateValueItem !== null}
        onClose={() => setUpdateValueItem(null)}
        investmentName={updateValueItem?.name ?? ''}
        currentValue={updateValueItem?.currentValue ?? undefined}
        onSubmit={handleUpdateValue}
        loading={updatingValue}
      />
    </View>
  );
}
