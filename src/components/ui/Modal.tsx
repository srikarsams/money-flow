import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
}: ModalProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1" />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            className="bg-white dark:bg-slate-800 rounded-t-3xl"
            style={{ paddingBottom: insets.bottom }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
              <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                {title || ''}
              </Text>
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  className="p-1"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDark ? '#94A3B8' : '#6B7280'}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Content */}
            <View className="px-4 py-4">
              {children}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}
