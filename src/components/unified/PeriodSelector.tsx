import { View, Text, Pressable, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { AnalyticsPeriod } from '@/src/types';
import { Modal } from '../ui/Modal';

interface PeriodSelectorProps {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  selectedMonth: number; // 0-11
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function PeriodSelector({
  period,
  onPeriodChange,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: PeriodSelectorProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const getDisplayText = () => {
    if (period === 'monthly') {
      return `${MONTHS[selectedMonth]} ${selectedYear}`;
    }
    return `${selectedYear}`;
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      {/* Period Toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderRadius: 12, padding: 4 }}>
        <Pressable
          onPress={() => onPeriodChange('monthly')}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: period === 'monthly' ? (isDark ? '#334155' : '#FFFFFF') : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: period === 'monthly' ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#94A3B8' : '#64748B'),
            }}
          >
            Monthly
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onPeriodChange('yearly')}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: period === 'yearly' ? (isDark ? '#334155' : '#FFFFFF') : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: period === 'yearly' ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#94A3B8' : '#64748B'),
            }}
          >
            Yearly
          </Text>
        </Pressable>
      </View>

      {/* Date Picker Button */}
      <Pressable
        onPress={() => setPickerVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '500', color: isDark ? '#FFFFFF' : '#0F172A', marginRight: 8 }}>
          {getDisplayText()}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </Pressable>

      {/* Picker Modal */}
      <Modal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title={period === 'monthly' ? 'Select Month' : 'Select Year'}
      >
        {period === 'monthly' ? (
          <View>
            {/* Year selector for monthly view */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Pressable onPress={() => onYearChange(selectedYear - 1)} style={{ padding: 8 }}>
                <Ionicons name="chevron-back" size={24} color="#64748b" />
              </Pressable>
              <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#FFFFFF' : '#0F172A', marginHorizontal: 16 }}>
                {selectedYear}
              </Text>
              <Pressable
                onPress={() => onYearChange(selectedYear + 1)}
                style={{ padding: 8 }}
                disabled={selectedYear >= currentYear}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={selectedYear >= currentYear ? '#cbd5e1' : '#64748b'}
                />
              </Pressable>
            </View>

            {/* Month grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {MONTHS.map((month, index) => {
                const isSelected = index === selectedMonth;
                const isFuture = selectedYear === currentYear && index > new Date().getMonth();

                return (
                  <Pressable
                    key={month}
                    onPress={() => {
                      if (!isFuture) {
                        onMonthChange(index);
                        setPickerVisible(false);
                      }
                    }}
                    disabled={isFuture}
                    style={{
                      width: '33.33%',
                      padding: 12,
                      alignItems: 'center',
                      backgroundColor: isSelected ? (isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF') : 'transparent',
                      borderRadius: isSelected ? 12 : 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isSelected ? '600' : '400',
                        color: isFuture
                          ? isDark ? '#475569' : '#CBD5E1'
                          : isSelected
                          ? isDark ? '#818CF8' : '#6366F1'
                          : isDark ? '#CBD5E1' : '#334155',
                      }}
                    >
                      {month.slice(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 320 }}>
            {years.map((year) => {
              const isSelected = year === selectedYear;
              return (
                <Pressable
                  key={year}
                  onPress={() => {
                    onYearChange(year);
                    setPickerVisible(false);
                  }}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor: isSelected ? (isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF') : (isDark ? '#334155' : '#F1F5F9'),
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 16,
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? (isDark ? '#818CF8' : '#6366F1') : (isDark ? '#CBD5E1' : '#334155'),
                    }}
                  >
                    {year}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}
