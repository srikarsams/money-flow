import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { Modal, Button } from '@/src/components/ui';
import { Category } from '@/src/types';

export type DateRangePreset = 'this_week' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all_time';

export interface FilterState {
  dateRange: DateRangePreset;
  categoryIds: string[];
  startDate: string | null;
  endDate: string | null;
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  categories: Category[];
}

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
];

export function getDateRangeFromPreset(preset: DateRangePreset): { startDate: string | null; endDate: string | null } {
  const now = new Date();

  switch (preset) {
    case 'this_week':
      return {
        startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      };
    case 'this_month':
      return {
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return {
        startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    case 'last_3_months':
      return {
        startDate: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    case 'this_year':
      return {
        startDate: `${now.getFullYear()}-01-01`,
        endDate: `${now.getFullYear()}-12-31`,
      };
    case 'all_time':
    default:
      return { startDate: null, endDate: null };
  }
}

export function FilterSheet({ visible, onClose, filters, onApply, categories }: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Reset local filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleDatePresetChange = (preset: DateRangePreset) => {
    const { startDate, endDate } = getDateRangeFromPreset(preset);
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: preset,
      startDate,
      endDate,
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setLocalFilters((prev) => {
      const isSelected = prev.categoryIds.includes(categoryId);
      return {
        ...prev,
        categoryIds: isSelected
          ? prev.categoryIds.filter((id) => id !== categoryId)
          : [...prev.categoryIds, categoryId],
      };
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      dateRange: 'this_month',
      categoryIds: [],
      ...getDateRangeFromPreset('this_month'),
    };
    setLocalFilters(defaultFilters);
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Filters">
      <View style={{ maxHeight: 350 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Date Range */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Date Range
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  onPress={() => handleDatePresetChange(preset.value)}
                  className={`px-3 py-2 rounded-lg ${
                    localFilters.dateRange === preset.value
                      ? 'bg-indigo-500'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      localFilters.dateRange === preset.value
                        ? 'text-white font-medium'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Categories */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Categories {localFilters.categoryIds.length > 0 && `(${localFilters.categoryIds.length})`}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((category) => {
                const isSelected = localFilters.categoryIds.includes(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleCategoryToggle(category.id)}
                    className={`flex-row items-center px-3 py-2 rounded-lg ${
                      isSelected ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={16}
                      color={isSelected ? '#FFFFFF' : category.color}
                    />
                    <Text
                      className={`text-sm ml-2 ${
                        isSelected ? 'text-white font-medium' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Actions - Always visible at bottom */}
      <View className="flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <View className="flex-1">
          <Button variant="secondary" onPress={handleReset} title="Reset" fullWidth />
        </View>
        <View className="flex-1">
          <Button onPress={handleApply} title="Apply" fullWidth />
        </View>
      </View>
    </Modal>
  );
}
