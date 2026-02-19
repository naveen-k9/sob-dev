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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Delivery Address</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleAddNewAddress}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Add New Address</Text>
              <Text style={styles.optionSubtitle}>
                Use map to set location precisely
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          {addresses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved Addresses</Text>
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
                      isSelected && styles.selectedAddressCard
                    ]}
                    onPress={() => handleSelectSavedAddress(address)}
                  >
                    <View style={styles.addressIcon}>
                      <Ionicons 
                        name={address.type === 'home' ? "home" : address.type === 'work' ? "business" : "location"} 
                        size={20} 
                        color={isServiceable ? "#007AFF" : "#8E8E93"} 
                      />
                    </View>
                    <View style={styles.addressContent}>
                      <View style={styles.addressTitleContainer}>
                        <Text style={styles.addressTitle}>
                          {address.label || address.name}
                        </Text>
                        {address.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressSubtitle}>
                        {address.addressLine}, {address.city}
                      </Text>
                      <Text style={styles.addressDetails}>
                        {address.state} - {address.pincode}
                      </Text>
                      {!isServiceable && (
                        <Text style={styles.notServiceableText}>
                          Not in serviceable area
                        </Text>
                      )}
                    </View>
                    {isSelected ? (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={20} 
                        color="#007AFF" 
                      />
                    ) : (
                      <Ionicons 
                        name="chevron-forward" 
                        size={20} 
                        color="#C7C7CC" 
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {addresses.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No Saved Addresses</Text>
              <Text style={styles.emptyDescription}>
                Add your first address to get started with deliveries
              </Text>
            </View>
          )}
        </ScrollView>
        
        {/* Confirm Button */}
        {selectedAddressId && (
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity 
              style={styles.confirmButton}
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
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
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
    borderColor: '#E53935',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
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
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  notServiceableText: {
    fontSize: 11,
    color: '#E53935',
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
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#E53935',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#E53935',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});