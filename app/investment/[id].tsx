import { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ImageViewer } from '@/src/components/ui/ImageViewer';
import { InvestmentForm } from '@/src/components/investment/InvestmentForm';
import { getInvestmentTypeColor } from '@/src/components/investment/InvestmentTypePicker';
import { Investment, InvestmentTypeItem, InvestmentInput } from '@/src/types';
import {
  getInvestmentById,
  updateInvestment,
  deleteInvestment,
} from '@/src/db/queries/investments';
import { getAllInvestmentTypes } from '@/src/db/queries/investment-types';
import { useTheme } from '@/src/hooks/useTheme';

export default function InvestmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [investment, setInvestment] = useState<Investment | null>(null);
  const [types, setTypes] = useState<InvestmentTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [inv, typesData] = await Promise.all([
        getInvestmentById(id),
        getAllInvestmentTypes(),
      ]);
      setInvestment(inv);
      setTypes(typesData);
    } catch (error) {
      console.error('Failed to load investment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: InvestmentInput) => {
    setUpdating(true);
    try {
      const updated = await updateInvestment(id, data);
      setInvestment(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update investment:', error);
      Alert.alert('Error', 'Failed to update investment. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Investment',
      'Are you sure you want to delete this investment transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInvestment(id);
              router.back();
            } catch (error) {
              console.error('Failed to delete investment:', error);
              Alert.alert('Error', 'Failed to delete investment.');
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

  if (!investment) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center px-4">
        <Text className="text-slate-500 dark:text-slate-400 text-center">
          Investment not found
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
        <InvestmentForm
          types={types}
          initialData={{
            name: investment.name,
            typeId: investment.typeId,
            type: investment.type,
            amount: investment.amount,
            date: investment.date,
            notes: investment.notes,
            imageUri: investment.imageUri,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          loading={updating}
          submitLabel="Update"
        />
      </View>
    );
  }

  const typeColor = investment.type
    ? getInvestmentTypeColor(investment.type.name)
    : '#6366F1';

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
            style={{ backgroundColor: typeColor + '20' }}
          >
            <Ionicons
              name={(investment.type?.icon as any) || 'cube'}
              size={40}
              color={typeColor}
            />
          </View>
          <Text className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            ${formatAmount(investment.amount)}
          </Text>
          <Text className="text-lg font-medium text-slate-900 dark:text-white mt-2">
            {investment.name}
          </Text>
          <Text className="text-base text-slate-500 dark:text-slate-400 mt-1">
            {investment.type?.name || 'Other'}
          </Text>
        </View>

        {/* Details Card */}
        <Card className="mb-4">
          <View className="gap-4">
            <View className="flex-row justify-between">
              <Text className="text-slate-500 dark:text-slate-400">Date</Text>
              <Text className="text-slate-900 dark:text-white font-medium">
                {formatDate(investment.date)}
              </Text>
            </View>

            {investment.notes && (
              <View>
                <Text className="text-slate-500 dark:text-slate-400 mb-1">Notes</Text>
                <Text className="text-slate-900 dark:text-white">{investment.notes}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Image */}
        {investment.imageUri && (
          <TouchableOpacity onPress={() => setShowImageViewer(true)} activeOpacity={0.9}>
            <Card className="mb-4 p-0 overflow-hidden">
              <Image
                source={{ uri: investment.imageUri }}
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

        {/* View Portfolio Button */}
        <Button
          title="View Portfolio"
          onPress={() => router.push(`/investment/portfolio/${encodeURIComponent(investment.name)}`)}
          variant="primary"
          icon="pie-chart-outline"
          fullWidth
        />

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-3 mb-6">
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
        <Button title="Back" onPress={() => router.back()} variant="ghost" fullWidth />
      </View>

      {/* Full Screen Image Viewer */}
      {investment.imageUri && (
        <ImageViewer
          visible={showImageViewer}
          imageUri={investment.imageUri}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </View>
  );
}
