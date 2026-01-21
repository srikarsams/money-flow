import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useTheme } from '@/src/hooks/useTheme';

interface UpdateValueModalProps {
  visible: boolean;
  onClose: () => void;
  investmentName: string;
  currentValue?: number;
  onSubmit: (value: number) => void;
  loading?: boolean;
}

export function UpdateValueModal({
  visible,
  onClose,
  investmentName,
  currentValue,
  onSubmit,
  loading = false,
}: UpdateValueModalProps) {
  const { isDark, colors } = useTheme();
  const [value, setValue] = useState(currentValue?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue) || numValue < 0) {
      setError('Please enter a valid amount');
      return;
    }
    setError(null);
    onSubmit(numValue);
  };

  const handleClose = () => {
    setValue(currentValue?.toString() ?? '');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleClose} title="Update Current Value">
      <View className="gap-4">
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          Enter the current market value of{' '}
          <Text className="font-medium text-slate-700 dark:text-slate-300">
            {investmentName}
          </Text>
        </Text>

        <View>
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Current Value
          </Text>
          <View
            className={`
              flex-row items-center
              bg-slate-100 dark:bg-slate-700
              rounded-xl px-4
              border
              ${error ? 'border-red-500' : 'border-transparent'}
            `}
          >
            <Text className="text-2xl text-slate-500 dark:text-slate-400 mr-2">$</Text>
            <TextInput
              className="flex-1 py-3 text-2xl text-slate-900 dark:text-white"
              placeholder="0.00"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              selectionColor={colors.primary}
              autoFocus
            />
          </View>
          {error && <Text className="text-sm text-red-500 mt-1">{error}</Text>}
        </View>

        <View className="flex-row gap-3 mt-2">
          <View className="flex-1">
            <Button title="Cancel" onPress={handleClose} variant="secondary" fullWidth />
          </View>
          <View className="flex-1">
            <Button title="Update" onPress={handleSubmit} loading={loading} fullWidth />
          </View>
        </View>
      </View>
    </Modal>
  );
}
