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
import { InvestmentTypePicker, getInvestmentTypeColor } from './InvestmentTypePicker';
import { InvestmentTypeItem, InvestmentInput } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';
import { getDistinctInvestmentNames } from '@/src/db/queries/investments';

interface InvestmentFormProps {
  types: InvestmentTypeItem[];
  initialData?: Partial<InvestmentInput> & { type?: InvestmentTypeItem };
  onSubmit: (data: InvestmentInput) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
  nameLocked?: boolean;
  existingNames?: string[];
}

export function InvestmentForm({
  types,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Add Investment',
  nameLocked = false,
  existingNames: providedNames,
}: InvestmentFormProps) {
  const { isDark, colors } = useTheme();

  const [name, setName] = useState(initialData?.name ?? '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '');
  const [selectedType, setSelectedType] = useState<InvestmentTypeItem | undefined>(
    initialData?.type ?? types.find((t) => t.id === initialData?.typeId)
  );
  const [date, setDate] = useState(
    initialData?.date ? new Date(initialData.date) : new Date()
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [imageUri, setImageUri] = useState<string | undefined>(initialData?.imageUri);

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; amount?: string; type?: string }>({});

  const [existingNames, setExistingNames] = useState<string[]>(providedNames ?? []);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!providedNames && !nameLocked) {
      loadExistingNames();
    }
  }, [providedNames, nameLocked]);

  const loadExistingNames = async () => {
    try {
      const names = await getDistinctInvestmentNames();
      setExistingNames(names);
    } catch (error) {
      console.error('Failed to load existing names:', error);
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (text.length > 0 && existingNames.length > 0) {
      const filtered = existingNames.filter((n) =>
        n.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);
  };

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
      Alert.alert('Permission Required', 'Please grant camera access to take photos.');
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

    if (!name.trim()) {
      newErrors.name = 'Please enter an investment name';
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!selectedType) {
      newErrors.type = 'Please select an investment type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      typeId: selectedType!.id,
      amount: parseFloat(amount),
      date: date.toISOString().split('T')[0],
      notes: notes.trim() || undefined,
      imageUri,
    });
  };

  const typeColor = selectedType ? getInvestmentTypeColor(selectedType.name) : '#6B7280';

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="gap-5 pb-6">
        {/* Investment Name */}
        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Investment Name
          </Text>
          <View className="relative">
            <TextInput
              className={`
                bg-slate-100 dark:bg-slate-700
                rounded-xl px-4 py-3
                text-base text-slate-900 dark:text-white
                border
                ${errors.name ? 'border-red-500' : 'border-transparent'}
                ${nameLocked ? 'opacity-70' : ''}
              `}
              placeholder="e.g., HDFC Flexi Cap, AAPL, Bitcoin"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              value={name}
              onChangeText={handleNameChange}
              editable={!nameLocked}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => {
                if (name.length > 0 && filteredSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            {nameLocked && (
              <View className="absolute right-3 top-3">
                <Ionicons name="lock-closed" size={18} color={isDark ? '#94A3B8' : '#6B7280'} />
              </View>
            )}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <View
                className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 rounded-xl mt-1 border border-slate-200 dark:border-slate-600 shadow-lg z-10"
                style={{ maxHeight: 200 }}
              >
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {filteredSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={suggestion}
                      onPress={() => selectSuggestion(suggestion)}
                      className={`px-4 py-3 ${
                        index < filteredSuggestions.length - 1
                          ? 'border-b border-slate-100 dark:border-slate-700'
                          : ''
                      }`}
                    >
                      <Text className="text-base text-slate-900 dark:text-white">
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          {errors.name && (
            <Text className="text-sm text-red-500 mt-1">{errors.name}</Text>
          )}
        </View>

        {/* Amount Input */}
        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Amount Invested
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
            <Text className="text-2xl text-slate-500 dark:text-slate-400 mr-2">$</Text>
            <TextInput
              className="flex-1 py-3 text-2xl text-slate-900 dark:text-white"
              placeholder="0.00"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              selectionColor={colors.primary}
            />
          </View>
          {errors.amount && (
            <Text className="text-sm text-red-500 mt-1">{errors.amount}</Text>
          )}
        </View>

        {/* Type Selector */}
        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Investment Type
          </Text>
          <TouchableOpacity
            onPress={() => setShowTypePicker(true)}
            className={`
              flex-row items-center justify-between
              bg-slate-100 dark:bg-slate-700
              rounded-xl px-4 py-3
              border
              ${errors.type ? 'border-red-500' : 'border-transparent'}
            `}
            activeOpacity={0.7}
          >
            {selectedType ? (
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: typeColor + '20' }}
                >
                  <Ionicons name={selectedType.icon as any} size={20} color={typeColor} />
                </View>
                <Text className="text-base text-slate-900 dark:text-white">
                  {selectedType.name}
                </Text>
              </View>
            ) : (
              <Text className="text-base text-slate-400 dark:text-slate-500">
                Select a type
              </Text>
            )}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? '#94A3B8' : '#9CA3AF'}
            />
          </TouchableOpacity>
          {errors.type && <Text className="text-sm text-red-500 mt-1">{errors.type}</Text>}
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
            Document/Image (optional)
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
              <Text className="text-slate-500 dark:text-slate-400 ml-2">Add photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1">
            <Button title="Cancel" onPress={onCancel} variant="secondary" fullWidth />
          </View>
          <View className="flex-1">
            <Button title={submitLabel} onPress={handleSubmit} loading={loading} fullWidth />
          </View>
        </View>
      </View>

      <InvestmentTypePicker
        types={types}
        selectedId={selectedType?.id}
        onSelect={setSelectedType}
        visible={showTypePicker}
        onClose={() => setShowTypePicker(false)}
      />
    </ScrollView>
  );
}
