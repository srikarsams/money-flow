import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InvestmentTypeItem } from '@/src/types';
import { Modal } from '../ui/Modal';
import { useTheme } from '@/src/hooks/useTheme';

interface InvestmentTypePickerProps {
  types: InvestmentTypeItem[];
  selectedId?: string;
  onSelect: (type: InvestmentTypeItem) => void;
  visible: boolean;
  onClose: () => void;
}

// Color mapping for investment types
const TYPE_COLORS: Record<string, string> = {
  Stocks: '#10B981',
  'Mutual Funds': '#6366F1',
  Crypto: '#F59E0B',
  Gold: '#EAB308',
  Bonds: '#3B82F6',
  'Real Estate': '#8B5CF6',
  Other: '#6B7280',
};

export function getInvestmentTypeColor(typeName: string): string {
  return TYPE_COLORS[typeName] || '#6366F1';
}

export function InvestmentTypePicker({
  types,
  selectedId,
  onSelect,
  visible,
  onClose,
}: InvestmentTypePickerProps) {
  const { isDark } = useTheme();

  const handleSelect = (type: InvestmentTypeItem) => {
    onSelect(type);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Select Investment Type">
      <ScrollView className="max-h-96">
        <View className="flex-row flex-wrap gap-3">
          {types.map((type) => {
            const isSelected = selectedId === type.id;
            const color = getInvestmentTypeColor(type.name);
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => handleSelect(type)}
                className={`
                  items-center justify-center p-3 rounded-xl w-[30%]
                  ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-700'}
                `}
                activeOpacity={0.7}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: color + '20' }}
                >
                  <Ionicons name={type.icon as any} size={24} color={color} />
                </View>
                <Text
                  className={`text-xs text-center ${
                    isSelected
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                  numberOfLines={2}
                >
                  {type.name}
                </Text>
                {isSelected && (
                  <View className="absolute top-2 right-2">
                    <Ionicons name="checkmark-circle" size={16} color="#6366F1" />
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
