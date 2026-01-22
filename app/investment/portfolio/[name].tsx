import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card, Button } from '@/src/components/ui';
import { InvestmentCard, UpdateValueModal, getInvestmentTypeColor } from '@/src/components/investment';
import { InvestmentLineChart } from '@/src/components/charts';
import {
  getInvestmentsByName,
  getValueHistory,
  getLatestValue,
  setCurrentValue,
  PortfolioItem,
} from '@/src/db/queries/investments';
import { Investment, InvestmentValue } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

export default function PortfolioDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const decodedName = decodeURIComponent(name || '');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [valueHistory, setValueHistory] = useState<InvestmentValue[]>([]);
  const [latestValue, setLatestValue] = useState<InvestmentValue | null>(null);
  const [showUpdateValue, setShowUpdateValue] = useState(false);
  const [updatingValue, setUpdatingValue] = useState(false);

  const loadData = async () => {
    try {
      const [investmentsData, historyData, latestValueData] = await Promise.all([
        getInvestmentsByName(decodedName),
        getValueHistory(decodedName, 30),
        getLatestValue(decodedName),
      ]);

      setInvestments(investmentsData);
      setValueHistory(historyData);
      setLatestValue(latestValueData);
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [decodedName])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpdateValue = async (value: number) => {
    setUpdatingValue(true);
    try {
      await setCurrentValue(decodedName, value);
      setShowUpdateValue(false);
      await loadData();
    } catch (error) {
      console.error('Failed to update value:', error);
    } finally {
      setUpdatingValue(false);
    }
  };

  const handleAddTransaction = () => {
    router.push(`/investment/new?name=${encodeURIComponent(decodedName)}`);
  };

  const handleTransactionPress = (investment: Investment) => {
    router.push(`/investment/${investment.id}`);
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

  // Calculate summary
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const currentValue = latestValue?.currentValue ?? null;
  const profit = currentValue !== null ? currentValue - totalInvested : null;
  const profitPercentage = profit !== null && totalInvested > 0 ? (profit / totalInvested) * 100 : null;
  const isProfit = profit !== null && profit >= 0;

  // Get type info from first investment
  const firstInvestment = investments[0];
  const typeName = firstInvestment?.type?.name ?? 'Investment';
  const typeIcon = firstInvestment?.type?.icon ?? 'cube';
  const typeColor = firstInvestment?.type ? getInvestmentTypeColor(firstInvestment.type.name) : '#6366F1';

  // Prepare chart data
  const chartData = valueHistory
    .slice()
    .reverse()
    .map((v) => ({
      date: v.recordedAt,
      value: v.currentValue,
    }));

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <Text className="text-slate-500 dark:text-slate-400">Loading...</Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="bg-white dark:bg-slate-800 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: typeColor + '20' }}
          >
            <Ionicons name={typeIcon as any} size={20} color={typeColor} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900 dark:text-white" numberOfLines={1}>
              {decodedName}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {typeName}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Summary Cards */}
        <View className="flex-row gap-3 mt-4">
          <Card className="flex-1">
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Total Invested
            </Text>
            <Text className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(totalInvested)}
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {investments.length} transaction{investments.length !== 1 ? 's' : ''}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Current Value
            </Text>
            {currentValue !== null ? (
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(currentValue)}
              </Text>
            ) : (
              <TouchableOpacity onPress={() => setShowUpdateValue(true)}>
                <Text className="text-lg font-medium text-indigo-500 dark:text-indigo-400">
                  Set value
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        {/* Profit Card */}
        {profit !== null && (
          <Card className="mt-3">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Profit / Loss
                </Text>
                <Text
                  className={`text-xl font-bold ${
                    isProfit
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {isProfit ? '+' : ''}
                  {formatCurrency(profit)}
                </Text>
              </View>
              <View
                className={`px-3 py-1.5 rounded-full ${
                  isProfit ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isProfit
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatPercentage(profitPercentage!)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Update Value Button */}
        <View className="mt-4">
          <Button
            title={currentValue !== null ? 'Update Value' : 'Set Current Value'}
            onPress={() => setShowUpdateValue(true)}
            variant="secondary"
            icon="refresh-outline"
            fullWidth
          />
        </View>

        {/* Value History Chart */}
        {chartData.length > 0 && (
          <Card className="mt-4">
            <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
              Value History
            </Text>
            <InvestmentLineChart
              data={chartData}
              color={typeColor}
              height={160}
            />
          </Card>
        )}

        {/* Transactions */}
        <View className="mt-6 mb-24">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">
              Transactions
            </Text>
            <TouchableOpacity
              onPress={handleAddTransaction}
              className="flex-row items-center"
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text className="text-sm font-medium text-indigo-500 dark:text-indigo-400 ml-1">
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {investments.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons
                name="receipt-outline"
                size={48}
                color={isDark ? '#475569' : '#CBD5E1'}
              />
              <Text className="text-slate-500 dark:text-slate-400 mt-2 text-center">
                No transactions yet
              </Text>
            </View>
          ) : (
            investments.map((investment) => (
              <InvestmentCard
                key={investment.id}
                investment={investment}
                onPress={() => handleTransactionPress(investment)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB for adding transaction */}
      <TouchableOpacity
        onPress={handleAddTransaction}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-500 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 8, marginBottom: insets.bottom }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Update Value Modal */}
      <UpdateValueModal
        visible={showUpdateValue}
        onClose={() => setShowUpdateValue(false)}
        investmentName={decodedName}
        currentValue={currentValue ?? undefined}
        onSubmit={handleUpdateValue}
        loading={updatingValue}
      />
    </View>
  );
}
