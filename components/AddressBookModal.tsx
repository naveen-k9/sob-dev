import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,

  Alert,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { Address, Polygon } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useAsyncStorage } from '@/hooks/useStorage';
import { findPolygonsContainingPoint } from '@/utils/polygonUtils';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/colors';
import { FONT_SIZE } from '@/src/ui/typography';
import { RADIUS, SCREEN_PADDING, SPACING } from '@/src/ui/layout';

interface AddressBookModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress?: (address: Address) => void;
  showSelectMode?: boolean;
}

export default function AddressBookModal({
  visible,
  onClose,
  onSelectAddress,
  showSelectMode = false,
}: AddressBookModalProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  const [polygons] = useAsyncStorage<Polygon[]>('polygons', []);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
      
      // Auto-select newly added address (within last 10 seconds)
      if (user.addresses.length > 0 && visible) {
        const newestAddress = user.addresses.reduce((newest, current) => {
          if (!newest.createdAt || !current.createdAt) return newest;
          return new Date(current.createdAt) > new Date(newest.createdAt) ? current : newest;
        });
        
        if (newestAddress.createdAt) {
          const timeDiff = Date.now() - new Date(newestAddress.createdAt).getTime();
          if (timeDiff < 10000) { // 10 seconds
            setSelectedAddressId(newestAddress.id);
          }
        }
      }
    }
  }, [user?.addresses, visible]);

  const handleSelectSavedAddress = (address: Address) => {
    const serviceablePolygons = findPolygonsContainingPoint(
      address.coordinates, 
      polygons.filter((p: Polygon) => p.completed)
    );
    const isServiceable = serviceablePolygons.length > 0;
    
    if (!isServiceable) {
      Alert.alert(
        'Address Not Serviceable',
        'This saved address is outside our service area. Please choose a different address or add a new one in a serviceable location.'
      );
      return;
    }
    
    // Just mark as selected, don't close modal yet
    setSelectedAddressId(address.id);
  };

  const handleConfirmAddress = () => {
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (selectedAddress && onSelectAddress) {
      onSelectAddress(selectedAddress);
    }
    onClose();
  };

  const handleAddNewAddress = () => {
    // Don't close the modal - keep it open for Zomato/Blinkit-style flow
    router.push({
      pathname: '/location/select',
      params: { 
        mode: 'pin',
        showOnlyServiceable: 'false',
        source: 'checkout'
      }
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Address Book</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
            onPress={handleAddNewAddress}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Add New Address</Text>
              <Text style={[styles.optionSubtitle, { color: colors.mutedText }]}>
                Use map to set location precisely
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
          </TouchableOpacity>

          {addresses.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Saved Addresses</Text>
              {addresses.map((address) => {
                const isServiceable = findPolygonsContainingPoint(
                  address.coordinates,
                  polygons.filter((p: Polygon) => p.completed)
                ).length > 0;
                
                const isSelected = selectedAddressId === address.id;
                
                return (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressCard,
                      { backgroundColor: colors.surface, shadowColor: colors.shadow },
                      isSelected && styles.selectedAddressCard
                    ]}
                    onPress={() => handleSelectSavedAddress(address)}
                  >
                    <View style={styles.addressIcon}>
                      <Ionicons 
                        name={address.type === 'home' ? "home" : address.type === 'work' ? "business" : "location"} 
                        size={20} 
                        color={isServiceable ? colors.primary : colors.mutedText} 
                      />
                    </View>
                    <View style={styles.addressContent}>
                      <View style={styles.addressTitleContainer}>
                        <Text style={[styles.addressTitle, { color: colors.text }]}>
                          {address.label || address.name}
                        </Text>
                        {address.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.addressSubtitle, { color: colors.textSecondary }]}>
                        {address.addressLine}, {address.city}
                      </Text>
                      <Text style={[styles.addressDetails, { color: colors.mutedText }]}>
                        {address.state} - {address.pincode}
                      </Text>
                      {/* {!isServiceable && (
                        <Text style={[styles.notServiceableText, { color: colors.warning }]}>
                          Not in serviceable area
                        </Text>
                      )} */}
                    </View>
                    {isSelected ? (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={20} 
                        color={colors.primary} 
                      />
                    ) : (
                      <Ionicons 
                        name="chevron-forward" 
                        size={20} 
                        color={colors.mutedText} 
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {addresses.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={64} color={colors.mutedText} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Saved Addresses</Text>
              <Text style={[styles.emptyDescription, { color: colors.mutedText }]}>
                Add your first address to get started with deliveries
              </Text>
            </View>
          )}
        </ScrollView>
        
        {/* Confirm Button */}
        {selectedAddressId && (
          <View style={[styles.bottomButtonContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={handleConfirmAddress}
            >
              <Text style={styles.confirmButtonText}>Use This Address</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: FONT_SIZE.sm,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedAddressCard: {
    borderColor: '#48479B',
    backgroundColor: '#FEF2F2',
  },
  addressIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: FONT_SIZE.sm,
  },
  notServiceableText: {
    fontSize: 11,
    color: '#48479B',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyDescription: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  bottomButtonContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  confirmButton: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  confirmButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});