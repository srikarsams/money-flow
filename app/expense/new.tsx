import { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseForm } from '@/src/components/expense/ExpenseForm';
import { Category, ExpenseInput } from '@/src/types';
import { getAllCategories } from '@/src/db/queries/categories';
import { createExpense } from '@/src/db/queries/expenses';

export default function NewExpenseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (data: ExpenseInput) => {
    setLoading(true);
    try {
      await createExpense(data);
      router.back();
    } catch (error) {
      console.error('Failed to create expense:', error);
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View
      className="flex-1 bg-white dark:bg-slate-900 px-4"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom }}
    >
      <ExpenseForm
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        submitLabel="Add Expense"
      />
    </View>
  );
}
