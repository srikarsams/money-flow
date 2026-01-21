import { View, TextInput, Text, TextInputProps } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export function Input({
  label,
  error,
  prefix,
  suffix,
  ...props
}: InputProps) {
  const { isDark, colors } = useTheme();

  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`
          flex-row items-center
          bg-slate-100 dark:bg-slate-700
          rounded-xl px-4
          border
          ${error ? 'border-red-500' : 'border-transparent'}
        `}
      >
        {prefix && (
          <Text className="text-slate-500 dark:text-slate-400 mr-1 text-base">
            {prefix}
          </Text>
        )}
        <TextInput
          className="flex-1 py-3 text-base text-slate-900 dark:text-white"
          placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
          selectionColor={colors.primary}
          {...props}
        />
        {suffix && (
          <Text className="text-slate-500 dark:text-slate-400 ml-1 text-base">
            {suffix}
          </Text>
        )}
      </View>
      {error && (
        <Text className="text-sm text-red-500 mt-1">{error}</Text>
      )}
    </View>
  );
}
