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
      {addresses.map((address) => (
        <View key={address.id} style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <View style={styles.addressInfo}>
              <Ionicons name="location" size={20} color="#FF3B30" />
              <View style={styles.addressDetails}>
                <Text style={styles.addressName}>{address.name}</Text>
                <Text style={styles.addressPhone}>{address.phoneNumber}</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {address.addressText}
                </Text>
                <Text style={styles.addressDate}>
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
                  <Ionicons name="pencil" size={16} color="#007AFF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(address)}
              >
                <Ionicons name="trash" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.coordinatesContainer}>
            <Text style={styles.coordinates}>
              📍 {address.coordinates.latitude.toFixed(6)}, {address.coordinates.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      ))}
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
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
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