import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
}: ButtonProps) {
  const baseStyles = 'flex-row items-center justify-center rounded-xl';

  const variantStyles = {
    primary: 'bg-indigo-500 active:bg-indigo-600',
    secondary: 'bg-slate-200 dark:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600',
    danger: 'bg-red-500 active:bg-red-600',
    ghost: 'bg-transparent',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-slate-900 dark:text-white',
    danger: 'text-white',
    ghost: 'text-indigo-500 dark:text-indigo-400',
  };

  const sizeStyles = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconColors = {
    primary: '#FFFFFF',
    secondary: undefined, // Will use text color
    danger: '#FFFFFF',
    ghost: '#6366F1',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
      `}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? '#6366F1' : '#FFFFFF'}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={iconSizes[size]}
              color={iconColors[variant]}
            />
          )}
          <Text
            className={`font-semibold ${textStyles[variant]} ${textSizeStyles[size]}`}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSizes[size]}
              color={iconColors[variant]}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
