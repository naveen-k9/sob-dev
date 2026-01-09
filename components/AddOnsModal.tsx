import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus, Minus } from 'lucide-react-native';
import { AddOn } from '@/types';
import { Colors } from '@/constants/colors';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

interface AddOnsModalProps {
  visible: boolean;
  onClose: () => void;
  addOns: AddOn[];
  selectedAddOns: string[];
  onToggleAddOn: (addOnId: string) => void;
  planPrice?: number;
  weekType?: 'mon-fri' | 'mon-sat';
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
  const availableDays: { key: DayKey; label: string; short: string }[] = isTrialMode
    ? [
        { key: 'mon', label: 'Day 1', short: '1' },
        { key: 'tue', label: 'Day 2', short: '2' },
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

  // Calculate add-ons price
  const addOnsPrice = selectedAddOns.reduce((sum, addOnId) => {
    const addOn = addOns.find(a => a.id === addOnId);
    if (!addOn) return sum;

    const selectedDaysCount = selectedAddOnDays[addOnId]?.length ?? 0;
    const daysPerWeek = isTrialMode ? 2 : weekType === 'mon-fri' ? 5 : 6;
    const weeks = Math.ceil(planDuration / daysPerWeek);

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
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.bottomSheet}>
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            {/* <View style={styles.handleBar} /> */}
            
            <View style={styles.sheetContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerIcon}>
                  <Text style={styles.headerIconText}>🍱</Text>
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>
                    Add Ons <Text style={styles.headerCount}>({addOns.length})</Text>
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    Add more items to your plan.
                  </Text>
                </View>
              </View>

              {/* Scrollable Content */}
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                <View style={styles.addOnsList}>
                {addOns.map((addOn) => {
                  const isSelected = selectedAddOns.includes(addOn.id);
                  const selectedDays = selectedAddOnDays[addOn.id] || [];
                  
                  return (
                    <View key={addOn.id} style={styles.addOnCard}>
                      <View style={styles.addOnMain}>
                        <View style={styles.addOnLeft}>
                          <View style={[styles.addOnImage, styles.addOnImageContainer]}> 
                            {addOn.image ? (
                              <Image
                                source={{ uri: addOn.image }}
                                style={styles.addOnImageInner}
                                resizeMode="cover"
                                onError={() => console.warn(`Failed to load addOn image: ${addOn.image}`)}
                              />
                            ) : (
                              <View style={styles.addOnImagePlaceholder}>
                                <Text style={styles.addOnImageEmoji}>🍽️</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.addOnInfo}>
                            <View style={styles.addOnTitleRow}>
                              {/* <View style={[styles.vegBadge, !addOn.isVeg && styles.nonVegBadge]} /> */}
                              <Text style={styles.addOnName}>{addOn.name}</Text>
                            </View>
                            {/* <Text style={styles.addOnDescription} numberOfLines={2}>
                              {addOn.description}
                            </Text> */}
                            <Text style={styles.addOnPrice}>
                              ₹{addOn.price}<Text style={styles.addOnPriceUnit}>/day</Text>
                            </Text>
                          </View>
                        </View>

                        {/* Add/Remove Button */}
                        <View style={styles.addOnActions}>
                          {!isSelected ? (
                            <TouchableOpacity 
                              style={styles.addButton} 
                              onPress={() => onToggleAddOn(addOn.id)}
                              activeOpacity={0.8}
                            >
                              <Plus size={18} color="white" strokeWidth={3} />
                              <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity 
                              style={styles.removeButton} 
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
                            <Text style={styles.daySelectorLabel}>Select days</Text>
                            {selectedDays.length === 0 && (
                              <Text style={styles.dayNote}>All days selected</Text>
                            )}
                          </View>
                          <View style={styles.daysRow}>
                            {availableDays.map((d) => {
                              const active = selectedDays.includes(d.key);
                              return (
                                <TouchableOpacity
                                  key={d.key}
                                  style={[styles.dayChip, active && styles.dayChipActive]}
                                  onPress={() => onToggleAddOnDay(addOn.id, d.key)}
                                  activeOpacity={0.6}
                                >
                                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
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
              <View style={styles.footer}>
              <View style={styles.footerInfo}>
                {planPrice > 0 ? (
                  <>
                    <Text style={styles.footerLabel}>
                      Plan: ₹{planPrice}{addOnsPrice > 0 && ` + Add-ons: ₹${addOnsPrice}`}
                    </Text>
                    <Text style={styles.footerTotal}>Total: ₹{totalPrice}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.footerLabel}>Add-ons Total</Text>
                    <Text style={styles.footerTotal}>₹{addOnsPrice}</Text>
                  </>
                )}
               
                  <Text style={styles.footerCount}>
                    {selectedAddOns.length} item{selectedAddOns.length > 1 ? 's' : ''} selected
                  </Text>
               
              </View>
              <TouchableOpacity style={styles.continueButton} onPress={onClose} activeOpacity={0.8}>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '72%',
    shadowColor: '#000',
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerCount: {
    color: '#6B7280',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
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
    width: '100%',
    height: '100%',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
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
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
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
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: Colors.accent,
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
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#EF4444',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
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
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  dayChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  dayChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayNote: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  footerInfo: {
    flex: 1,
    marginRight: 16,
  },
  footerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  footerCount: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
