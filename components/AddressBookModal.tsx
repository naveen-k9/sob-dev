import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
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
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedAddressCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
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
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#34C759',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addressSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: 14,
    color: '#8E8E93',
  },
  notServiceableText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});