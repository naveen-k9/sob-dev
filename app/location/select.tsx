import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Stack, router, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Search, Navigation, Bell } from 'lucide-react-native';
import { useLocation } from '@/contexts/LocationContext';
import { ServiceableLocation } from '@/types';
import db from '@/db';

export default function LocationSelectScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { serviceableLocations, selectLocation, getCurrentLocation, locationState } = useLocation();
  const routerInstance = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyName, setNotifyName] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifyLocation, setNotifyLocation] = useState('');

  React.useEffect(() => {
    setCanGoBack(routerInstance.canGoBack());
  }, []);

  useEffect(() => {
    // Check if user location is not serviceable
    if (locationState.userLocation && !locationState.isLocationServiceable) {
      setShowNotifyModal(true);
    }
  }, [locationState]);



  const handleLocationSelect = async (location: ServiceableLocation) => {
    await selectLocation(location);
    Alert.alert(
      'Location Selected',
      `You've selected ${location.name}. Delivery fee: ₹${location.deliveryFee}`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (canGoBack) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          },
        },
      ]
    );
  };

  const handleCurrentLocation = async () => {
    try {
      await getCurrentLocation();
      if (locationState.isLocationServiceable) {
        Alert.alert('Success', 'Location detected successfully!');
        if (canGoBack) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setShowNotifyModal(true);
      }
    } catch {
      Alert.alert('Error', 'Could not get your location. Please select manually.');
    }
  };

  const handleNotifyRequest = async () => {
    if (!notifyName.trim() || !notifyPhone.trim() || !notifyLocation.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await db.createNotifyRequest({
        name: notifyName,
        phone: notifyPhone,
        location: notifyLocation,
        coordinates: locationState.userLocation || undefined,
      });
      
      setShowNotifyModal(false);
      setNotifyName('');
      setNotifyPhone('');
      setNotifyLocation('');
      
      Alert.alert(
        'Request Submitted',
        'Thank you! We&apos;ll notify you when we start delivering to your area.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (canGoBack) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting notify request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    }
  };

  const filteredLocations = serviceableLocations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderLocationItem = ({ item }: { item: ServiceableLocation }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.locationIcon}>
        <MapPin size={20} color="#FF6B35" />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationDetails}>
          Delivery fee: ₹{item.deliveryFee} • {item.radius}km radius
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Select Location',
          headerLeft: canGoBack ? () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
          ) : undefined,
        }}
      />

      <View style={styles.content}>
        {/* Current Location Button */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleCurrentLocation}
        >
          <Navigation size={20} color="#FF6B35" />
          <Text style={styles.currentLocationText}>Use Current Location</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for area, street name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Locations List */}
        <Text style={styles.sectionTitle}>Available Locations</Text>
        <FlatList
          data={filteredLocations}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.locationsList}
        />
        
        {/* Notify Me Modal */}
        <Modal
          visible={showNotifyModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Area Not Serviceable</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowNotifyModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.notifyIcon}>
                <Bell size={48} color="#FF6B35" />
              </View>
              
              <Text style={styles.notifyTitle}>
                We don&apos;t deliver to your area yet
              </Text>
              
              <Text style={styles.notifyDescription}>
                Leave your details and we&apos;ll notify you when we start delivering to your location.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  value={notifyName}
                  onChangeText={setNotifyName}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={notifyPhone}
                  onChangeText={setNotifyPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Your Location</Text>
                <TextInput
                  style={styles.input}
                  value={notifyLocation}
                  onChangeText={setNotifyLocation}
                  placeholder="Enter your area/locality"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={styles.notifyButton}
                onPress={handleNotifyRequest}
              >
                <Text style={styles.notifyButtonText}>Notify Me</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentLocationText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  locationsList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationDetails: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  notifyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  notifyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  notifyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'white',
  },
  notifyButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});