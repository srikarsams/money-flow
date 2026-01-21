import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/src/types';
import { Modal } from '../ui/Modal';
import { useTheme } from '@/src/hooks/useTheme';

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
  visible: boolean;
  onClose: () => void;
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  visible,
  onClose,
}: CategoryPickerProps) {
  const { isDark } = useTheme();

  const handleSelect = (category: Category) => {
    onSelect(category);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Select Category">
      <ScrollView className="max-h-96">
        <View className="flex-row flex-wrap gap-3">
          {categories.map((category) => {
            const isSelected = selectedId === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleSelect(category)}
                className={`
                  items-center justify-center p-3 rounded-xl w-[30%]
                  ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-700'}
                `}
                activeOpacity={0.7}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={24}
                    color={category.color}
                  />
                </View>
                <Text
                  className={`text-xs text-center ${
                    isSelected
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                  numberOfLines={2}
                >
                  {category.name}
                </Text>
                {isSelected && (
                  <View className="absolute top-2 right-2">
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#6366F1"
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Modal>
  );
}
