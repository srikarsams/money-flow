import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageViewerProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

export function ImageViewer({ visible, imageUri, onClose }: ImageViewerProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View className="flex-1 bg-black">
        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          className="absolute z-10 p-2 bg-black/50 rounded-full"
          style={{ top: insets.top + 10, right: 16 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Image */}
        <View className="flex-1 items-center justify-center">
          <Image
            source={{ uri: imageUri }}
            style={{ width, height: height * 0.8 }}
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
}
