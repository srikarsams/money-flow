import { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ImageViewer } from '@/src/components/ui/ImageViewer';
import { ExpenseForm } from '@/src/components/expense/ExpenseForm';
import { Expense, Category, ExpenseInput } from '@/src/types';
import { getExpenseById, updateExpense, deleteExpense } from '@/src/db/queries/expenses';
import { getAllCategories } from '@/src/db/queries/categories';
import { useTheme } from '@/src/hooks/useTheme';

export default function IncomeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [income, setIncome] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [inc, cats] = await Promise.all([
        getExpenseById(id),
        getAllCategories('income'),
      ]);
      setIncome(inc);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load income:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: ExpenseInput) => {
    setUpdating(true);
    try {
      const updated = await updateExpense(id, data);
      setIncome(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update income:', error);
      Alert.alert('Error', 'Failed to update income. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(id);
              router.back();
            } catch (error) {
              console.error('Failed to delete income:', error);
              Alert.alert('Error', 'Failed to delete income.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <Text className="text-slate-500 dark:text-slate-400">Loading...</Text>
      </View>
    );
  }

  if (!income) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center px-4">
        <Text className="text-slate-500 dark:text-slate-400 text-center">
          Income not found
        </Text>
        <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  if (isEditing) {
    return (
      <View
        className="flex-1 bg-white dark:bg-slate-900 px-4"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom }}
      >
        <ExpenseForm
          categories={categories}
          initialData={{
            title: income.title,
            amount: income.amount,
            categoryId: income.categoryId,
            category: income.category,
            type: income.type,
            date: income.date,
            notes: income.notes,
            imageUri: income.imageUri,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          loading={updating}
          submitLabel="Update"
          type="income"
        />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center py-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{
              backgroundColor: (income.category?.color || '#10B981') + '20',
            }}
          >
            <Ionicons
              name={(income.category?.icon as any) || 'cash'}
              size={40}
              color={income.category?.color || '#10B981'}
            />
          </View>
          <Text className="text-3xl font-bold text-green-500 dark:text-green-400">
            +${formatAmount(income.amount)}
          </Text>
          {income.title && (
            <Text className="text-lg font-medium text-slate-900 dark:text-white mt-2">
              {income.title}
            </Text>
          )}
          <Text className="text-base text-slate-500 dark:text-slate-400 mt-1">
            {income.category?.name || 'Uncategorized'}
          </Text>
        </View>

        {/* Details Card */}
        <Card className="mb-4">
          <View className="gap-4">
            <View className="flex-row justify-between">
              <Text className="text-slate-500 dark:text-slate-400">Date</Text>
              <Text className="text-slate-900 dark:text-white font-medium">
                {formatDate(income.date)}
              </Text>
            </View>

            {income.notes && (
              <View>
                <Text className="text-slate-500 dark:text-slate-400 mb-1">
                  Notes
                </Text>
                <Text className="text-slate-900 dark:text-white">
                  {income.notes}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Image */}
        {income.imageUri && (
          <TouchableOpacity
            onPress={() => setShowImageViewer(true)}
            activeOpacity={0.9}
          >
            <Card className="mb-4 p-0 overflow-hidden">
              <Image
                source={{ uri: income.imageUri }}
                className="w-full h-64"
                resizeMode="cover"
              />
              <View className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-1 flex-row items-center">
                <Ionicons name="expand-outline" size={14} color="white" />
                <Text className="text-white text-xs ml-1">Tap to view</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1">
            <Button
              title="Edit"
              onPress={() => setIsEditing(true)}
              variant="secondary"
              icon="create-outline"
              fullWidth
            />
          </View>
          <View className="flex-1">
            <Button
              title="Delete"
              onPress={handleDelete}
              variant="danger"
              icon="trash-outline"
              fullWidth
            />
          </View>
        </View>
      </ScrollView>

      {/* Back Button */}
      <View className="px-4 pb-4">
        <Button
          title="Back"
          onPress={() => router.back()}
          variant="ghost"
          fullWidth
        />
      </View>

      {/* Full Screen Image Viewer */}
      {income.imageUri && (
        <ImageViewer
          visible={showImageViewer}
          imageUri={income.imageUri}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </View>
  );
}
