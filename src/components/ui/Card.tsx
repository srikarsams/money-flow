import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
}

export function Card({ children, onPress, className = '', style }: CardProps) {
  const baseStyles = 'bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm';

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`${baseStyles} ${className}`}
        style={style}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`${baseStyles} ${className}`} style={style}>
      {children}
    </View>
  );
}
