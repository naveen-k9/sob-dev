import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '@/types';
import { useActiveAddress } from '@/contexts/ActiveAddressContext';

interface AddressListProps {
  addresses: Address[];
  onDeleteAddress: (id: string) => void;
  onEditAddress?: (address: Address) => void;
}

const AddressList: React.FC<AddressListProps> = ({
  addresses,
  onDeleteAddress,
  onEditAddress,
}) => {
  const { isAddressActive, setActiveAddress } = useActiveAddress();
  const handleDelete = (address: Address) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${address.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteAddress(address.id)
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (addresses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="location-outline" size={48} color="#C7C7CC" />
        <Text style={styles.emptyText}>No addresses saved yet</Text>
        <Text style={styles.emptySubText}>Add your first address to get started</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Saved Addresses ({addresses.length})</Text>
      {addresses.map((address) => {
        const isActive = isAddressActive(address.id);
        
        return (
          <TouchableOpacity 
            key={address.id} 
            style={[
              styles.addressCard,
              isActive && styles.activeAddressCard
            ]}
            onPress={() => setActiveAddress(address)}
          >
            <View style={styles.addressHeader}>
              <View style={styles.addressInfo}>
                <Ionicons 
                  name="location" 
                  size={20} 
                  color={isActive ? "#FFFFFF" : "#FF3B30"} 
                />
                <View style={styles.addressDetails}>
                  <View style={styles.nameContainer}>
                    <Text style={[
                      styles.addressName,
                      isActive && styles.activeText
                    ]}>
                      {address.name}
                    </Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.addressPhone,
                    isActive && styles.activeSubText
                  ]}>
                    {address.phoneNumber}
                  </Text>
                  <Text style={[
                    styles.addressText,
                    isActive && styles.activeSubText
                  ]} numberOfLines={2}>
                    {address.addressText}
                  </Text>
                  <Text style={[
                    styles.addressDate,
                    isActive && styles.activeSubText
                  ]}>
                    Added {formatDate(address.createdAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                {onEditAddress && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEditAddress(address)}
                  >
                    <Ionicons 
                      name="pencil" 
                      size={16} 
                      color={isActive ? "#FFFFFF" : "#007AFF"} 
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(address)}
                >
                  <Ionicons 
                    name="trash" 
                    size={16} 
                    color={isActive ? "#FFFFFF" : "#FF3B30"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.coordinatesContainer}>
              <Text style={[
                styles.coordinates,
                isActive && styles.activeSubText
              ]}>
                📍 {address.coordinates.latitude.toFixed(6)}, {address.coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeAddressCard: {
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  addressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  activeText: {
    color: '#FFFFFF',
  },
  activeSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  activeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  addressPhone: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 6,
  },
  addressDate: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  coordinatesContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 8,
  },
  coordinates: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default AddressList;