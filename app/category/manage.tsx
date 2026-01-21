import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card, Button, Modal } from '@/src/components/ui';
import { Category } from '@/src/types';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/src/db/queries/categories';
import { useTheme } from '@/src/hooks/useTheme';

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#6B7280',
];

const ICONS = [
  'restaurant', 'cart', 'car', 'flash', 'home',
  'bag', 'game-controller', 'fitness', 'body', 'receipt',
  'shield-checkmark', 'school', 'airplane', 'gift', 'medical',
  'paw', 'construct', 'cafe', 'beer', 'pizza',
  'bus', 'bicycle', 'boat', 'train', 'hardware-chip',
  'phone-portrait', 'tv', 'musical-notes', 'film', 'book',
];

export default function ManageCategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSelectedColor(COLORS[0]);
    setSelectedIcon(ICONS[0]);
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setSelectedColor(category.color);
    setSelectedIcon(category.icon);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setName('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          icon: selectedIcon,
          color: selectedColor,
        });
      } else {
        await createCategory(name.trim(), selectedIcon, selectedColor);
      }
      closeModal();
      await loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      Alert.alert('Error', 'Failed to save category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: Category) => {
    if (!category.isCustom) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              await loadCategories();
            } catch (error) {
              console.error('Failed to delete category:', error);
              Alert.alert('Error', 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  return (
    <View
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <View className="bg-white dark:bg-slate-800 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-white flex-1">
            Manage Categories
          </Text>
          <TouchableOpacity
            onPress={openAddModal}
            className="bg-indigo-500 rounded-full p-2"
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {categories.map((category) => (
          <Card key={category.id} className="mb-3">
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: category.color + '20' }}
              >
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color={category.color}
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-slate-900 dark:text-white">
                  {category.name}
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {category.isCustom ? 'Custom' : 'Default'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => openEditModal(category)}
                className="p-2 mr-1"
              >
                <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {category.isCustom && (
                <TouchableOpacity
                  onPress={() => handleDelete(category)}
                  className="p-2"
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))}
        <View className="h-8" />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <View className="gap-4">
          {/* Name Input */}
          <View>
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Name
            </Text>
            <TextInput
              className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
              placeholder="Category name"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Color Picker */}
          <View>
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Color
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    selectedColor === color ? 'border-2 border-slate-900 dark:border-white' : ''
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon Picker */}
          <View>
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Icon
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    className={`w-12 h-12 rounded-xl items-center justify-center ${
                      selectedIcon === icon
                        ? 'bg-indigo-100 dark:bg-indigo-900/30'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <Ionicons
                      name={icon as any}
                      size={24}
                      color={selectedIcon === icon ? '#6366F1' : colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Preview */}
          <View className="items-center py-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: selectedColor + '20' }}
            >
              <Ionicons name={selectedIcon as any} size={32} color={selectedColor} />
            </View>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Preview
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Cancel"
                onPress={closeModal}
                variant="secondary"
                fullWidth
              />
            </View>
            <View className="flex-1">
              <Button
                title={editingCategory ? 'Update' : 'Add'}
                onPress={handleSave}
                loading={saving}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
