import { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InvestmentForm } from '@/src/components/investment/InvestmentForm';
import { InvestmentTypeItem, InvestmentInput } from '@/src/types';
import { getAllInvestmentTypes } from '@/src/db/queries/investment-types';
import { createInvestment } from '@/src/db/queries/investments';

export default function NewInvestmentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [types, setTypes] = useState<InvestmentTypeItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const data = await getAllInvestmentTypes();
      setTypes(data);
    } catch (error) {
      console.error('Failed to load investment types:', error);
    }
  };

  const handleSubmit = async (data: InvestmentInput) => {
    setLoading(true);
    try {
      await createInvestment(data);
      router.back();
    } catch (error) {
      console.error('Failed to create investment:', error);
      Alert.alert('Error', 'Failed to save investment. Please try again.');
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
      <InvestmentForm
        types={types}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        submitLabel="Add Investment"
      />
    </View>
  );
}
