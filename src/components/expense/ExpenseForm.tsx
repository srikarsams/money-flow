import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CategoryPicker } from './CategoryPicker';
import { Category, ExpenseInput, TransactionType } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface ExpenseFormProps {
  categories: Category[];
  initialData?: Partial<ExpenseInput> & { category?: Category };
  onSubmit: (data: ExpenseInput) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
  type?: TransactionType;
}

export function ExpenseForm({
  categories,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Add Expense',
  type = 'expense',
}: ExpenseFormProps) {
  const { isDark, colors } = useTheme();
  const isIncome = type === 'income';

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '');
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(
    initialData?.category ?? categories.find((c) => c.id === initialData?.categoryId)
  );
  const [date, setDate] = useState(
    initialData?.date ? new Date(initialData.date) : new Date()
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [imageUri, setImageUri] = useState<string | undefined>(initialData?.imageUri);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to attach images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera access to take photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Add Image', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeImage = () => {
    setImageUri(undefined);
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      title: title.trim() || undefined,
      amount: parseFloat(amount),
      categoryId: selectedCategory!.id,
      type,
      date: date.toISOString().split('T')[0],
      notes: notes.trim() || undefined,
      imageUri,
    });
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="gap-5 pb-6">
        {/* Title Input */}
        <Input
          label="Title (optional)"
          placeholder="e.g., Coffee at Starbucks"
          value={title}
          onChangeText={setTitle}
        />

        {/* Amount Input */}
        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Amount
          </Text>
          <View
            className={`
              flex-row items-center
              bg-slate-100 dark:bg-slate-700
              rounded-xl px-4
              border
              ${errors.amount ? 'border-red-500' : 'border-transparent'}
            `}
          >
            <Text className={`text-2xl mr-2 ${isIncome ? 'text-green-500' : 'text-slate-500 dark:text-slate-400'}`}>
              {isIncome ? '+$' : '$'}
            </Text>
            <TextInput
              className={`flex-1 py-3 text-2xl ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              selectionColor={isIncome ? '#10B981' : colors.primary}
            />
          </View>
          {errors.amount && (
            <Text className="text-sm text-red-500 mt-1">{errors.amount}</Text>
          )}
        </View>

        {/* Category Selector */}
        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Category
          </Text>
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            className={`
              flex-row items-center justify-between
              bg-slate-100 dark:bg-slate-700
              rounded-xl px-4 py-3
              border
              ${errors.category ? 'border-red-500' : 'border-transparent'}
            `}
            activeOpacity={0.7}
          >
            {selectedCategory ? (
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: selectedCategory.color + '20' }}
                >
                  <Ionicons
                    name={selectedCategory.icon as any}
                    size={20}
                    color={selectedCategory.color}
                  />
                </View>
                <Text className="text-base text-slate-900 dark:text-white">
                  {selectedCategory.name}
                </Text>
              </View>
            ) : (
              <Text className="text-base text-slate-400 dark:text-slate-500">
                Select a category
              </Text>
            )}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? '#94A3B8' : '#9CA3AF'}
            />
          </TouchableOpacity>
          {errors.category && (
            <Text className="text-sm text-red-500 mt-1">{errors.category}</Text>
          )}
        </View>

        {/* Date Selector */}
        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Date
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center justify-between bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="calendar-outline"
                size={20}
                color={isDark ? '#94A3B8' : '#6B7280'}
                style={{ marginRight: 12 }}
              />
              <Text className="text-base text-slate-900 dark:text-white">
                {formatDate(date)}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? '#94A3B8' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Notes Input */}
        <Input
          label="Notes (optional)"
          placeholder="Add a note..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {/* Image Attachment */}
        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Receipt/Image (optional)
          </Text>
          {imageUri ? (
            <View className="relative">
              <Image
                source={{ uri: imageUri }}
                className="w-full h-48 rounded-xl"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={removeImage}
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={showImageOptions}
              className="flex-row items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl py-8 border-2 border-dashed border-slate-300 dark:border-slate-600"
              activeOpacity={0.7}
            >
              <Ionicons
                name="camera-outline"
                size={24}
                color={isDark ? '#94A3B8' : '#6B7280'}
              />
              <Text className="text-slate-500 dark:text-slate-400 ml-2">
                Add photo
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1">
            <Button
              title="Cancel"
              onPress={onCancel}
              variant="secondary"
              fullWidth
            />
          </View>
          <View className="flex-1">
            <Button
              title={submitLabel}
              onPress={handleSubmit}
              loading={loading}
              fullWidth
            />
          </View>
        </View>
      </View>

      <CategoryPicker
        categories={categories}
        selectedId={selectedCategory?.id}
        onSelect={setSelectedCategory}
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
      />
    </ScrollView>
  );
}
