import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import AddressForm from '@/components/AddressForm';
import AddressList from '@/components/AddressList';
import { useAsyncStorage } from '@/hooks/useStorage';
import { Address } from '@/types';

const INITIAL_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function AddressManager() {
  const [addresses, setAddresses, loadingAddresses] = useAsyncStorage<Address[]>('addresses', []);
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);
  // Removed region state to avoid controlled MapView blinking

  const handleSubmitAddress = (addressData: {
    name: string;
    phoneNumber: string;
    addressText: string;
    coordinates: { latitude: number; longitude: number };
  }) => {
    const newAddress: Address = {
      id: Date.now().toString(),
      ...addressData,
      createdAt: new Date(),
    };

    setAddresses([...addresses, newAddress]);
    setShowForm(false);
  };

  const handleDeleteAddress = (id: string) => {
    const updatedAddresses = addresses.filter(a => a.id !== id);
    setAddresses(updatedAddresses);
  };

  const AddressMap = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.mapContainer, styles.webContainer]}>
          <View style={styles.webPlaceholder}>
            <Text style={styles.webText}>Map View (Native only)</Text>
            <Text style={styles.webSubText}>
              This feature requires react-native-maps which is not available on web
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={INITIAL_REGION}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {addresses.map((address) => (
            <Marker
              key={address.id}
              coordinate={address.coordinates}
              title={address.name}
              description={address.addressText}
            />
          ))}
        </MapView>
      </View>
    );
  };

  if (loadingAddresses) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showForm) {
    return (
      <SafeAreaView style={styles.container}>
        <AddressForm
          onSubmit={handleSubmitAddress}
          onCancel={() => setShowForm(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Address Manager</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowList(!showList)}
          >
            <Ionicons 
              name={showList ? "map" : "list"} 
              size={20} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.addButton]}
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {showList ? (
        <AddressList
          addresses={addresses}
          onDeleteAddress={handleDeleteAddress}
        />
      ) : (
        <>
          <AddressMap />
          {addresses.length === 0 && (
            <View style={styles.emptyMapOverlay}>
              <View style={styles.emptyMapContent}>
                <Ionicons name="location-outline" size={48} color="#C7C7CC" />
                <Text style={styles.emptyMapText}>No addresses yet</Text>
                <Text style={styles.emptyMapSubText}>
                  Add your first address to see it on the map
                </Text>
                <TouchableOpacity
                  style={styles.emptyMapButton}
                  onPress={() => setShowForm(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.emptyMapButtonText}>Add Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  webContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  webPlaceholder: {
    padding: 40,
    alignItems: 'center',
  },
  webText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  webSubText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyMapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 242, 247, 0.9)',
  },
  emptyMapContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyMapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMapSubText: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyMapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});