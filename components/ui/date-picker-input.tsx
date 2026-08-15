import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
import { InputField } from './input-field';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerInputProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChangeDate: (formattedDate: string) => void;
  required?: boolean;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  requireAdult?: boolean;
}

const formatDobDigits = (text: string): string => {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const calculateAge = (dobString: string): number | null => {
  if (!dobString || !/^\d{4}-\d{2}-\d{2}$/.test(dobString)) return null;
  const [yearStr, monthStr, dayStr] = dobString.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age >= 0 ? age : null;
};

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChangeDate,
  required = false,
  error,
  containerStyle,
  labelStyle,
  placeholder = 'YYYY-MM-DD (e.g. 1995-05-20)',
  minYear = 1940,
  maxYear = new Date().getFullYear(),
  requireAdult = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'month' | 'year'>('calendar');

  // Parse initial state date or fallback
  const parsedDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const adultYear = new Date().getFullYear() - 25;
    return { year: adultYear, month: 0, day: 1 };
  }, [value]);

  const [selectedYear, setSelectedYear] = useState(parsedDate.year);
  const [selectedMonth, setSelectedMonth] = useState(parsedDate.month);
  const [selectedDay, setSelectedDay] = useState(parsedDate.day);

  // Sync state when modal opens
  const openModal = () => {
    setSelectedYear(parsedDate.year);
    setSelectedMonth(parsedDate.month);
    setSelectedDay(parsedDate.day);
    setViewMode('calendar');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Calendar calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; dateStr: string; isAdultValid: boolean }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({ day: dayNum, isCurrentMonth: false, dateStr, isAdultValid: true });
    }

    // Current month days
    const today = new Date();
    const maxAdultDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const isAdultValid = !requireAdult || dateObj <= maxAdultDate;
      days.push({ day: d, isCurrentMonth: true, dateStr, isAdultValid });
    }

    // Next month padding to fill 6 full rows (42 days)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: false, dateStr, isAdultValid: true });
    }

    return days;
  }, [selectedYear, selectedMonth, requireAdult]);

  // Year list generator
  const yearsList = useMemo(() => {
    const adultCutoffYear = new Date().getFullYear() - (requireAdult ? 18 : 0);
    const topYear = Math.min(maxYear, adultCutoffYear);
    const list: number[] = [];
    for (let y = topYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear, requireAdult]);

  // Current prospective date
  const prospectiveDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const prospectiveAge = calculateAge(prospectiveDateStr);
  const isEligible = prospectiveAge !== null && (!requireAdult || prospectiveAge >= 18);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
  };

  const handleConfirm = () => {
    const formatted = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onChangeDate(formatted);
    setIsModalOpen(false);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Quick Age shortcuts
  const selectQuickAge = (ageYears: number) => {
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() - ageYears);
    setSelectedYear(targetDate.getFullYear());
    setSelectedMonth(targetDate.getMonth());
    setSelectedDay(targetDate.getDate());
    setViewMode('calendar');
  };

  const currentAge = calculateAge(value);

  return (
    <View style={[styles.container, containerStyle]}>
      <InputField
        label={label}
        value={value}
        onChangeText={(text) => onChangeDate(formatDobDigits(text))}
        required={required}
        error={error}
        placeholder={placeholder}
        keyboardType="number-pad"
        maxLength={10}
        labelStyle={labelStyle}
        icon={<Ionicons name="calendar-outline" size={18} color={colors.primary} />}
        trailing={
          <Pressable onPress={openModal} style={styles.calendarIconButton} hitSlop={10}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.calendarIconGradient}
            >
              <Ionicons name="calendar" size={15} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        }
      />

      {currentAge !== null ? (
        <View style={styles.ageBadgeRow}>
          <Ionicons
            name={currentAge >= 18 ? 'checkmark-circle' : 'alert-circle'}
            size={13}
            color={currentAge >= 18 ? colors.success : colors.danger}
          />
          <Text
            style={[
              styles.ageBadgeText,
              { color: currentAge >= 18 ? colors.success : colors.danger },
            ]}
          >
            Age: {currentAge} years {currentAge >= 18 ? '• Eligible (18+)' : '• Under 18 (Required 18+)'}
          </Text>
        </View>
      ) : null}

      {/* Obsidian Calendar Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropPressable} onPress={closeModal} />

          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Date of Birth</Text>
                <Text style={styles.modalSubtitle}>
                  {MONTH_NAMES[selectedMonth]} {selectedDay}, {selectedYear}
                  {prospectiveAge !== null ? ` • ${prospectiveAge} yrs (${isEligible ? 'Eligible' : 'Under 18'})` : ''}
                </Text>
              </View>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Quick Age Presets */}
            <View style={styles.quickAgeRow}>
              <Text style={styles.quickAgeLabel}>Quick:</Text>
              {[18, 25, 30, 40].map((age) => (
                <Pressable
                  key={age}
                  onPress={() => selectQuickAge(age)}
                  style={[
                    styles.quickAgeChip,
                    prospectiveAge === age && styles.quickAgeChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickAgeChipText,
                      prospectiveAge === age && styles.quickAgeChipTextActive,
                    ]}
                  >
                    {age} yrs
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Month & Year Navigation Bar */}
            <View style={styles.navBar}>
              <Pressable
                onPress={() => setViewMode(viewMode === 'month' ? 'calendar' : 'month')}
                style={[styles.navSelectorButton, viewMode === 'month' && styles.navSelectorButtonActive]}
              >
                <Text style={styles.navSelectorText}>{MONTH_NAMES[selectedMonth]}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.primary} />
              </Pressable>

              <Pressable
                onPress={() => setViewMode(viewMode === 'year' ? 'calendar' : 'year')}
                style={[styles.navSelectorButton, viewMode === 'year' && styles.navSelectorButtonActive]}
              >
                <Text style={styles.navSelectorText}>{selectedYear}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.primary} />
              </Pressable>

              {viewMode === 'calendar' ? (
                <View style={styles.monthArrows}>
                  <Pressable onPress={handlePrevMonth} style={styles.arrowBtn}>
                    <Ionicons name="chevron-back" size={18} color={colors.text} />
                  </Pressable>
                  <Pressable onPress={handleNextMonth} style={styles.arrowBtn}>
                    <Ionicons name="chevron-forward" size={18} color={colors.text} />
                  </Pressable>
                </View>
              ) : null}
            </View>

            {/* VIEW MODE: Month Picker Grid */}
            {viewMode === 'month' ? (
              <View style={styles.monthGrid}>
                {MONTH_SHORT.map((mShort, idx) => {
                  const isSelected = selectedMonth === idx;
                  return (
                    <Pressable
                      key={mShort}
                      onPress={() => {
                        setSelectedMonth(idx);
                        setViewMode('calendar');
                      }}
                      style={[styles.monthCell, isSelected && styles.monthCellSelected]}
                    >
                      <Text style={[styles.monthCellText, isSelected && styles.monthCellTextSelected]}>
                        {mShort}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {/* VIEW MODE: Year Picker Grid */}
            {viewMode === 'year' ? (
              <ScrollView style={styles.yearScroll} contentContainerStyle={styles.yearGrid}>
                {yearsList.map((yr) => {
                  const isSelected = selectedYear === yr;
                  return (
                    <Pressable
                      key={yr}
                      onPress={() => {
                        setSelectedYear(yr);
                        setViewMode('calendar');
                      }}
                      style={[styles.yearCell, isSelected && styles.yearCellSelected]}
                    >
                      <Text style={[styles.yearCellText, isSelected && styles.yearCellTextSelected]}>
                        {yr}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* VIEW MODE: Calendar Day Grid */}
            {viewMode === 'calendar' ? (
              <View style={styles.calendarWrap}>
                {/* Weekday headers */}
                <View style={styles.weekHeaderRow}>
                  {WEEK_DAYS.map((wd) => (
                    <Text key={wd} style={styles.weekHeaderCell}>{wd}</Text>
                  ))}
                </View>

                {/* Day Grid */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((item, idx) => {
                    const isSelected =
                      item.isCurrentMonth &&
                      item.day === selectedDay;

                    return (
                      <Pressable
                        key={`${item.dateStr}-${idx}`}
                        disabled={!item.isCurrentMonth || !item.isAdultValid}
                        onPress={() => handleSelectDay(item.day)}
                        style={[
                          styles.dayCell,
                          !item.isCurrentMonth && styles.dayCellOutside,
                          isSelected && styles.dayCellSelected,
                          !item.isAdultValid && item.isCurrentMonth && styles.dayCellDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayCellText,
                            !item.isCurrentMonth && styles.dayCellTextOutside,
                            isSelected && styles.dayCellTextSelected,
                            !item.isAdultValid && item.isCurrentMonth && styles.dayCellTextDisabled,
                          ]}
                        >
                          {item.day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Modal Actions Footer */}
            <View style={styles.modalFooter}>
              <Pressable onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                disabled={!isEligible}
                style={[styles.confirmButton, !isEligible && styles.confirmButtonDisabled]}
              >
                <LinearGradient
                  colors={isEligible ? gradients.primary : ['#334155', '#F8FAFC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmGradient}
                >
                  <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>Set Date of Birth</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  calendarIconButton: {
    padding: 3,
  },
  calendarIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  ageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  ageBadgeText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 13, 26, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 18,
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  quickAgeLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.textSecondary,
  },
  quickAgeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickAgeChipActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderColor: colors.primary,
  },
  quickAgeChipText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.textSecondary,
  },
  quickAgeChipTextActive: {
    color: colors.primary,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  navSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  navSelectorButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  navSelectorText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: '#F8FAFC',
  },
  monthArrows: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarWrap: {
    marginBottom: 16,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    marginVertical: 2,
  },
  dayCellOutside: {
    opacity: 0.2,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  dayCellDisabled: {
    opacity: 0.35,
  },
  dayCellText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: '#F1F5F9',
  },
  dayCellTextOutside: {
    color: colors.textSecondary,
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bodyBold,
  },
  dayCellTextDisabled: {
    color: colors.danger,
    textDecorationLine: 'line-through',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  monthCell: {
    width: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  monthCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthCellText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: '#F8FAFC',
  },
  monthCellTextSelected: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bodyBold,
  },
  yearScroll: {
    maxHeight: 220,
    marginBottom: 16,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  yearCell: {
    width: '22%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  yearCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearCellText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: '#F8FAFC',
  },
  yearCellTextSelected: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bodyBold,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 2,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  confirmButtonText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});


