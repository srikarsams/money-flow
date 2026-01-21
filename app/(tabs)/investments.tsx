import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/src/components/ui';
import {
  PortfolioCard,
  InvestmentCard,
  UpdateValueModal,
  getInvestmentTypeColor,
} from '@/src/components/investment';
import {
  getPortfolioSummary,
  getAllInvestments,
  setCurrentValue,
  PortfolioSummary,
  PortfolioItem,
} from '@/src/db/queries/investments';
import { getAllInvestmentTypes } from '@/src/db/queries/investment-types';
import { Investment, InvestmentTypeItem } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';
import { Modal, Button } from '@/src/components/ui';

type ViewMode = 'portfolio' | 'transactions';

export default function InvestmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const [viewMode, setViewMode] = useState<ViewMode>('portfolio');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [portfolio, setPortfolio] = useState<PortfolioSummary>({
    totalInvested: 0,
    totalCurrentValue: 0,
    totalProfit: 0,
    totalProfitPercentage: 0,
    items: [],
  });
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [types, setTypes] = useState<InvestmentTypeItem[]>([]);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  // Update value modal
  const [updateValueItem, setUpdateValueItem] = useState<PortfolioItem | null>(null);
  const [updatingValue, setUpdatingValue] = useState(false);

  const loadData = async () => {
    try {
      setError(null);
      const filterOptions = selectedTypeId ? { typeId: selectedTypeId } : undefined;

      const [portfolioData, investmentsData, typesData] = await Promise.all([
        getPortfolioSummary(filterOptions),
        getAllInvestments({ ...filterOptions, limit: 50 }),
        getAllInvestmentTypes(),
      ]);

      setPortfolio(portfolioData);
      setInvestments(investmentsData);
      setTypes(typesData);
    } catch (err) {
      console.error('Failed to load investments:', err);
      setError('Failed to load investment data.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedTypeId])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddInvestment = () => {
    router.push('/investment/new');
  };

  const handleInvestmentPress = (investment: Investment) => {
    router.push(`/investment/${investment.id}`);
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
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const activeFiltersCount = selectedTypeId ? 1 : 0;
  const hasValue = portfolio.totalCurrentValue > 0;
  const isProfit = portfolio.totalProfit >= 0;

  const selectedType = types.find((t) => t.id === selectedTypeId);

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
              Investments
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {selectedType ? selectedType.name : 'All Types'}
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

        {/* View Mode Toggle */}
        <View className="flex-row mt-4 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          <TouchableOpacity
            onPress={() => setViewMode('portfolio')}
            className={`flex-1 py-2 rounded-md ${
              viewMode === 'portfolio' ? 'bg-white dark:bg-slate-600' : ''
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                viewMode === 'portfolio'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Portfolio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('transactions')}
            className={`flex-1 py-2 rounded-md ${
              viewMode === 'transactions' ? 'bg-white dark:bg-slate-600' : ''
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                viewMode === 'transactions'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Transactions
            </Text>
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

        {/* Portfolio Summary Cards */}
        <View className="flex-row gap-3 mt-4">
          <Card className="flex-1">
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Total Invested
            </Text>
            <Text className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(portfolio.totalInvested)}
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
                  {isProfit ? '+' : ''}
                  {formatCurrency(portfolio.totalProfit)}
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
              <Text className="text-lg font-bold text-slate-400 dark:text-slate-500">
                --
              </Text>
            )}
          </Card>
        </View>

        {/* Portfolio or Transactions View */}
        {viewMode === 'portfolio' ? (
          <View className="mt-4 mb-24">
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
                  Tap the + button to add your first investment
                </Text>
              </View>
            ) : (
              portfolio.items.map((item) => (
                <PortfolioCard
                  key={item.name}
                  item={item}
                  onUpdateValue={() => setUpdateValueItem(item)}
                />
              ))
            )}
          </View>
        ) : (
          <View className="mt-4 mb-24">
            {investments.length === 0 ? (
              <View className="items-center py-12">
                <Ionicons
                  name="receipt-outline"
                  size={64}
                  color={isDark ? '#475569' : '#CBD5E1'}
                />
                <Text className="text-slate-500 dark:text-slate-400 mt-4 text-center">
                  No transactions yet
                </Text>
              </View>
            ) : (
              investments.map((investment) => (
                <InvestmentCard
                  key={investment.id}
                  investment={investment}
                  onPress={() => handleInvestmentPress(investment)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleAddInvestment}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-500 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 8 }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Investments"
      >
        <View className="mb-6">
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Investment Type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              onPress={() => setSelectedTypeId(null)}
              className={`px-3 py-2 rounded-lg ${
                selectedTypeId === null
                  ? 'bg-indigo-500'
                  : 'bg-slate-100 dark:bg-slate-700'
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
            {types.map((type) => {
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
                  <Ionicons
                    name={type.icon as any}
                    size={16}
                    color={isSelected ? '#FFFFFF' : color}
                  />
                  <Text
                    className={`text-sm ml-2 ${
                      isSelected
                        ? 'text-white font-medium'
                        : 'text-slate-700 dark:text-slate-300'
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
              onPress={() => {
                setSelectedTypeId(null);
              }}
              title="Reset"
              fullWidth
            />
          </View>
          <View className="flex-1">
            <Button onPress={() => setShowFilters(false)} title="Apply" fullWidth />
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
