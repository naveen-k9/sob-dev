import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus, Minus } from 'lucide-react-native';
import { AddOn } from '@/types';
import { getColors } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZE } from '@/src/ui/typography';
import { RADIUS, SPACING } from '@/src/ui/layout';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface AddOnsModalProps {
  visible: boolean;
  onClose: () => void;
  addOns: AddOn[];
  selectedAddOns: string[];
  onToggleAddOn: (addOnId: string) => void;
  planPrice?: number;
  weekType?: 'mon-fri' | 'mon-sat' | 'everyday';
  selectedAddOnDays?: Record<string, DayKey[]>;
  onToggleAddOnDay?: (addOnId: string, day: DayKey) => void;
  planDuration?: number;
  isTrialMode?: boolean;
}

export default function AddOnsModal({
  visible,
  onClose,
  addOns,
  selectedAddOns,
  onToggleAddOn,
  planPrice = 0,
  weekType = 'mon-fri',
  selectedAddOnDays = {},
  onToggleAddOnDay,
  planDuration = 0,
  isTrialMode = false,
}: AddOnsModalProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const availableDays: { key: DayKey; label: string; short: string }[] = isTrialMode
    ? [
        { key: 'mon', label: 'Day 1', short: '1' },
        { key: 'tue', label: 'Day 2', short: '2' },
      ]
    : weekType === 'everyday'
    ? [
        { key: 'mon', label: 'Mon', short: 'M' },
        { key: 'tue', label: 'Tue', short: 'T' },
        { key: 'wed', label: 'Wed', short: 'W' },
        { key: 'thu', label: 'Thu', short: 'T' },
        { key: 'fri', label: 'Fri', short: 'F' },
        { key: 'sat', label: 'Sat', short: 'S' },
        { key: 'sun', label: 'Sun', short: 'S' },
      ]
    : weekType === 'mon-fri'
    ? [
        { key: 'mon', label: 'Mon', short: 'M' },
        { key: 'tue', label: 'Tue', short: 'T' },
        { key: 'wed', label: 'Wed', short: 'W' },
        { key: 'thu', label: 'Thu', short: 'T' },
        { key: 'fri', label: 'Fri', short: 'F' },
      ]
    : [
        { key: 'mon', label: 'Mon', short: 'M' },
        { key: 'tue', label: 'Tue', short: 'T' },
        { key: 'wed', label: 'Wed', short: 'W' },
        { key: 'thu', label: 'Thu', short: 'T' },
        { key: 'fri', label: 'Fri', short: 'F' },
        { key: 'sat', label: 'Sat', short: 'S' },
      ];

  /**
   * Calculate total add-ons price
   * 
   * Logic:
   * - If specific days are selected for an add-on, charge for those days only (multiplied by weeks)
   * - If no days selected (default), charge for all plan days
   * - For trial mode (2 days), simplified calculation
   */
  const addOnsPrice = selectedAddOns.reduce((sum, addOnId) => {
    const addOn = addOns.find(a => a.id === addOnId);
    if (!addOn) return sum;

    const selectedDaysCount = selectedAddOnDays[addOnId]?.length ?? 0;
    const daysPerWeek = isTrialMode
      ? 2
      : weekType === 'everyday'
        ? 7
        : weekType === 'mon-fri'
          ? 5
          : 6; // mon-sat

    const weeks = Math.ceil(planDuration / daysPerWeek);

    // If no specific days selected, charge for all plan days
    // If specific days selected, charge for (selected days × weeks) up to plan duration
    const totalDaysForAddon = selectedDaysCount === 0 
      ? planDuration 
      : Math.min(planDuration, weeks * selectedDaysCount);

    return sum + (addOn.price * totalDaysForAddon);
  }, 0);

  const totalPrice = planPrice + addOnsPrice;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <X size={24} color={colors.surface} />
        </TouchableOpacity>

        <View style={[styles.bottomSheet, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            {/* <View style={styles.handleBar} /> */}
            
            <View style={styles.sheetContent}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={[styles.headerIcon, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={styles.headerIconText}>🍱</Text>
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Add Ons <Text style={[styles.headerCount, { color: colors.mutedText }]}>({addOns.length})</Text>
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
                    Add more items to your plan.
                  </Text>
                </View>
              </View>

              {/* Scrollable Content */}
              <ScrollView 
                style={[styles.scrollView, { backgroundColor: colors.background }]}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                <View style={styles.addOnsList}>
                {addOns.map((addOn) => {
                  const isSelected = selectedAddOns.includes(addOn.id);
                  const selectedDays = selectedAddOnDays[addOn.id] || [];
                  
                  return (
                    <View key={addOn.id} style={[styles.addOnCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
                      <View style={styles.addOnMain}>
                        <View style={styles.addOnLeft}>
                          <View style={[styles.addOnImage, styles.addOnImageContainer]}>
                            {addOn.image ? (
                              <Image
                                source={addOn.image}
                                style={styles.addOnImageInner}
                                contentFit="cover"
                              />
                            ) : (
                              <View style={[styles.addOnImagePlaceholder, styles.addOnImageInner]}>
                                <Text style={styles.addOnImageEmoji}>🍽️</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.addOnInfo}>
                            <View style={styles.addOnTitleRow}>
                              {/* <View style={[styles.vegBadge, !addOn.isVeg && styles.nonVegBadge]} /> */}
                              <Text style={[styles.addOnName, { color: colors.text }]}>{addOn.name}</Text>
                            </View>
                            {/* <Text style={styles.addOnDescription} numberOfLines={2}>
                              {addOn.description}
                            </Text> */}
                            <Text style={[styles.addOnPrice, { color: colors.primary }]}>
                              ₹{addOn.price}<Text style={styles.addOnPriceUnit}>/day</Text>
                            </Text>
                          </View>
                        </View>

                        {/* Add/Remove Button */}
                        <View style={styles.addOnActions}>
                          {!isSelected ? (
                            <TouchableOpacity 
                              style={[styles.addButton, { backgroundColor: colors.accent, shadowColor: colors.accent }]} 
                              onPress={() => onToggleAddOn(addOn.id)}
                              activeOpacity={0.8}
                            >
                              <Plus size={18} color={colors.surface} strokeWidth={3} />
                              <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity 
                              style={[styles.removeButton, { backgroundColor: colors.error, shadowColor: colors.error }]} 
                              onPress={() => onToggleAddOn(addOn.id)}
                              activeOpacity={0.8}
                            >
                              {/* <Minus size={18} color="white" strokeWidth={3} /> */}
                              <Text style={styles.removeButtonText}>Remove</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Day Selection */}
                      {isSelected && onToggleAddOnDay && (
                        <View style={styles.daySelector}>
                          <View style={styles.daySelectorHeader}>
                            <Text style={[styles.daySelectorLabel, { color: colors.textSecondary }]}>Select days</Text>
                            {selectedDays.length === 0 && (
                              <Text style={[styles.dayNote, { color: colors.success }]}>All days selected</Text>
                            )}
                          </View>
                          <View style={styles.daysRow}>
                            {availableDays.map((d) => {
                              const active = selectedDays.includes(d.key);
                              return (
                                <TouchableOpacity
                                  key={d.key}
                                  style={[
                                    styles.dayChip,
                                    { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
                                    active && [styles.dayChipActive, { borderColor: colors.primary, backgroundColor: colors.primary }],
                                  ]}
                                  onPress={() => onToggleAddOnDay(addOn.id, d.key)}
                                  activeOpacity={0.6}
                                >
                                  <Text style={[styles.dayChipText, { color: colors.mutedText }, active && styles.dayChipTextActive]}>
                                    {d.label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={styles.footerInfo}>
                {planPrice > 0 ? (
                  <>
                    <Text style={[styles.footerLabel, { color: colors.mutedText }]}>
                      Plan: ₹{planPrice}{addOnsPrice > 0 && ` + Add-ons: ₹${addOnsPrice}`}
                    </Text>
                    <Text style={[styles.footerTotal, { color: colors.text }]}>Total: ₹{totalPrice}</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.footerLabel, { color: colors.mutedText }]}>Add-ons Total</Text>
                    <Text style={[styles.footerTotal, { color: colors.text }]}>₹{addOnsPrice}</Text>
                  </>
                )}
               
                  <Text style={[styles.footerCount, { color: colors.success }]}>
                    {selectedAddOns.length} item{selectedAddOns.length > 1 ? 's' : ''} selected
                  </Text>
               
              </View>
              <TouchableOpacity style={[styles.continueButton, { backgroundColor: colors.primary }]} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    width: 45,
    height: 45,
    borderRadius: 27,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '72%',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 28,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerCount: {
    color: '#6B7280',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  addOnsList: {
    padding: 16,
    paddingBottom: 8,
  },
  addOnCard: {
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 9,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  addOnMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addOnLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 10,
    gap: 12,
    alignItems: 'center',
  },
  addOnImage: {
    width: 45,
    height: 45,
    borderRadius: 12,
  },
  addOnImageContainer: {
    overflow: 'hidden',
  },
  addOnImageInner: {
    width: 45,
    height: 45,
  },
  addOnImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOnImageEmoji: {
    fontSize: 28,
  },
  addOnInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  addOnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vegBadge: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#059669',
  },
  nonVegBadge: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  addOnName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
  },
  addOnDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  addOnPrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  addOnPriceUnit: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  addOnActions: {
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  daySelector: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  daySelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  daySelectorLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  dayChipActive: {
    borderColor: '#48479B',
    backgroundColor: '#48479B',
  },
  dayChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayNote: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  footerInfo: {
    flex: 1,
    marginRight: 16,
  },
  footerLabel: {
    fontSize: FONT_SIZE.xs,
    marginBottom: 2,
  },
  footerTotal: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  footerCount: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  continueButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
