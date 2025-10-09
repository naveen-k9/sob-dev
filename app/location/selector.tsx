import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAsyncStorage } from '@/hooks/useStorage';
import { Address } from '@/types';

interface LocationSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
  name: string;
}

export default function LocationSelectorScreen() {
  // State management
  const [addresses, setAddresses] = useAsyncStorage<Address[]>('addresses', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Location state
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 17.3850, // Hyderabad coordinates as shown in images
    longitude: 78.4867,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Address form state
  const [houseNumber, setHouseNumber] = useState('');
  const [buildingBlock, setBuildingBlock] = useState('');
  const [landmarkArea, setLandmarkArea] = useState('');
  const [addressLabel, setAddressLabel] = useState('home');

  // Refs
  const mapRef = useRef<MapView | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to use this feature.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      
      // Update map region to center on current location
      setMapRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync(coords);
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
        
        setSelectedLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: formattedAddress,
          name: address.name || 'Current Location',
        });
      }

    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Mock search function (replace with Google Places API)
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    
    // Mock suggestions - replace with actual Google Places API
    const mockSuggestions: LocationSuggestion[] = [
      {
        place_id: '1',
        description: 'Naveen Nagar, Banjara Hills, Hyderabad, Telangana, India',
        structured_formatting: {
          main_text: 'Naveen Nagar',
          secondary_text: 'Banjara Hills, Hyderabad, Telangana, India',
        },
      },
      {
        place_id: '2',
        description: 'Naveen gold & bros, Ruby Block, Brundavan Colony, Bolarum, Hyderabad, Telangana, India',
        structured_formatting: {
          main_text: 'Naveen gold & bros',
          secondary_text: 'Ruby Block, Brundavan Colony, Bolarum, Hyderabad',
        },
      },
      {
        place_id: '3',
        description: 'Naveena Monty School',
        structured_formatting: {
          main_text: 'Naveena Monty School',
          secondary_text: 'Hyderabad, Telangana',
        },
      },
    ].filter(item => 
      item.description.toLowerCase().includes(query.toLowerCase())
    );

    setSuggestions(mockSuggestions);
    setIsSearching(false);
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    searchAddresses(text);
  };

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    // Mock coordinates - replace with actual geocoding
    const mockCoords = {
      latitude: 17.3850 + (Math.random() - 0.5) * 0.01,
      longitude: 78.4867 + (Math.random() - 0.5) * 0.01,
    };

    setSelectedLocation({
      latitude: mockCoords.latitude,
      longitude: mockCoords.longitude,
      address: suggestion.description,
      name: suggestion.structured_formatting.main_text,
    });

    setSearchQuery('');
    setSuggestions([]);
    setShowSearchModal(false);
    setShowMapView(true);
  };

  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    
    try {
      // Reverse geocode the coordinates to get address
      const result = await Location.reverseGeocodeAsync(coordinate);
      if (result.length > 0) {
        const address = result[0];
        const formattedAddress = `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
        
        setSelectedLocation({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          address: formattedAddress,
          name: address.name || 'Selected Location',
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      // Navigate back with the selected location
      router.back();
      // You can also store this location or pass it back via context/callback
    }
  };

  const handleSaveAddress = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location first.');
      return;
    }

    if (!houseNumber.trim()) {
      Alert.alert('Error', 'Please enter house number and floor.');
      return;
    }

    const newAddress: Address = {
      id: Date.now().toString(),
      name: selectedLocation.name,
      phoneNumber: '', // You can add phone input if needed
      addressText: `${houseNumber}${buildingBlock ? ', ' + buildingBlock : ''}${landmarkArea ? ', ' + landmarkArea : ''}, ${selectedLocation.address}`,
      coordinates: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      },
      createdAt: new Date(),
      userId: '',
      type: addressLabel as 'home' | 'work' | 'other',
      label: addressLabel,
      phone: '',
      addressLine: selectedLocation.address,
      street: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
      updatedAt: undefined,
    };

    setAddresses([...addresses, newAddress]);
    
    // Reset form
    setHouseNumber('');
    setBuildingBlock('');
    setLandmarkArea('');
    setAddressLabel('home');
    setShowAddressForm(false);
    setShowMapView(false);
    
    Alert.alert('Success', 'Address saved successfully!');
  };

  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Address</Text>
          <TouchableOpacity
            onPress={() => setShowSearchModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search Address"
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={() => {
            setShowSearchModal(false);
            getCurrentLocation();
            setShowMapView(true);
          }}
          disabled={isLoadingLocation}
        >
          <Ionicons name="locate" size={20} color="#E91E63" />
          <Text style={styles.currentLocationText}>Use my Current Location</Text>
          {isLoadingLocation && <ActivityIndicator size="small" color="#E91E63" />}
        </TouchableOpacity>

        <ScrollView style={styles.suggestionsContainer}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.place_id}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Ionicons name="location-outline" size={20} color="#666" />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionMainText}>
                    {suggestion.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.suggestionSecondaryText}>
                    {suggestion.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderMapView = () => (
    <Modal
      visible={showMapView}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <TouchableOpacity
            onPress={() => setShowMapView(false)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.mapTitle}>Select Your Location</Text>
        </View>

        <View style={styles.mapSearchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.mapSearchInput}
            placeholder="Search for apartment, street name..."
            onFocus={() => setShowSearchModal(true)}
          />
        </View>

        <View style={styles.mapViewContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                draggable
                onDragEnd={(e) => handleMapPress({ nativeEvent: e.nativeEvent })}
              />
            )}
          </MapView>

          {selectedLocation && (
            <View style={styles.locationTooltip}>
              <Text style={styles.tooltipText}>Order will be delivered here</Text>
              <Text style={styles.tooltipSubtext}>Place the pin to your exact location</Text>
            </View>
          )}
        </View>

        {selectedLocation && (
          <View style={styles.locationDetails}>
            <Text style={styles.locationName}>{selectedLocation.name}</Text>
            <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.changeButton]}
                onPress={() => setShowAddressForm(true)}
              >
                <Text style={styles.changeButtonText}>Add Address</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleConfirmLocation}
              >
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderAddressForm = () => (
    <Modal
      visible={showAddressForm}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowAddressForm(false)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Address...</Text>
        </View>

        <ScrollView style={styles.formContainer}>
          {/* Mini Map */}
          {selectedLocation && (
            <View style={styles.miniMapContainer}>
              <MapView
                style={styles.miniMap}
                region={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                />
              </MapView>
              
              <View style={styles.miniMapOverlay}>
                <Text style={styles.detectedLocation}>{selectedLocation.name}</Text>
                <Text style={styles.detectedAddress}>{selectedLocation.address}</Text>
                <TouchableOpacity style={styles.changeLocationButton}>
                  <Text style={styles.changeLocationText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Address Form */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Add Address</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>House No. & Floor *</Text>
              <TextInput
                style={styles.textInput}
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder="Enter house number and floor"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Building & Block No. (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={buildingBlock}
                onChangeText={setBuildingBlock}
                placeholder="Enter building and block number"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Landmark & Area Name (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={landmarkArea}
                onChangeText={setLandmarkArea}
                placeholder="Enter landmark and area name"
              />
            </View>
          </View>

          {/* Address Label */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Add Address Label</Text>
            <View style={styles.labelContainer}>
              {['home', 'work', 'other'].map((label) => (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.labelButton,
                    addressLabel === label && styles.labelButtonActive,
                  ]}
                  onPress={() => setAddressLabel(label)}
                >
                  <Text
                    style={[
                      styles.labelButtonText,
                      addressLabel === label && styles.labelButtonTextActive,
                    ]}
                  >
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.formFooter}>
          <TouchableOpacity
            style={styles.saveAddressButton}
            onPress={handleSaveAddress}
          >
            <Text style={styles.saveAddressButtonText}>SAVE ADDRESS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Select Location',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => setShowSearchModal(true)}
        >
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search Address</Text>
        </TouchableOpacity>

        {/* Current Location Option */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => {
            getCurrentLocation();
            setShowMapView(true);
          }}
          disabled={isLoadingLocation}
        >
          <Ionicons name="locate" size={20} color="#E91E63" />
          <Text style={styles.optionText}>Use my Current Location</Text>
          {isLoadingLocation && <ActivityIndicator size="small" color="#E91E63" />}
        </TouchableOpacity>

        {/* Add New Address */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => setShowMapView(true)}
        >
          <Ionicons name="add" size={20} color="#E91E63" />
          <Text style={styles.optionText}>Add New Address</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* Request from Friend */}
        <TouchableOpacity style={styles.optionItem}>
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          <Text style={styles.optionText}>Request address from friend</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* Saved Addresses */}
        {addresses.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            {addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={styles.addressItem}
                onPress={() => {
                  setSelectedLocation({
                    latitude: address.coordinates.latitude,
                    longitude: address.coordinates.longitude,
                    address: address.addressText,
                    name: address.name,
                  });
                  router.back();
                }}
              >
                <View style={styles.addressIconContainer}>
                  <Ionicons 
                    name={address.type === 'home' ? 'home' : address.type === 'work' ? 'briefcase' : 'location'} 
                    size={20} 
                    color="#666" 
                  />
                </View>
                <View style={styles.addressTextContainer}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.addressType}>
                      {address.type === 'home' ? 'Home' : address.type === 'work' ? 'Work' : 'Other'}
                    </Text>
                    <Text style={styles.addressDistance}>• 12 m</Text>
                  </View>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {address.addressText}
                  </Text>
                </View>
                <View style={styles.addressActions}>
                  <TouchableOpacity style={styles.shareButton}>
                    <Ionicons name="share-outline" size={16} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      {renderSearchModal()}
      {renderMapView()}
      {renderAddressForm()}
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
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 16,
  },
  addressItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  addressIconContainer: {
    marginRight: 12,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addressDistance: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: 8,
    marginRight: 4,
  },
  moreButton: {
    padding: 8,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: '#FFF5F8',
    borderRadius: 12,
    marginBottom: 16,
  },
  currentLocationText: {
    fontSize: 16,
    color: '#E91E63',
    flex: 1,
    marginLeft: 12,
  },
  suggestionsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionMainText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  suggestionSecondaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Map View Styles
  mapContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  mapSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  mapSearchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  mapViewContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  locationTooltip: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tooltipSubtext: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 2,
  },
  locationDetails: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  changeButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  changeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#E91E63',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Address Form Styles
  formContainer: {
    flex: 1,
  },
  miniMapContainer: {
    height: 200,
    position: 'relative',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  miniMap: {
    flex: 1,
  },
  miniMapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  detectedLocation: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detectedAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  changeLocationButton: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changeLocationText: {
    fontSize: 14,
    color: '#333',
  },
  formSection: {
    padding: 16,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  labelContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  labelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  labelButtonActive: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  labelButtonText: {
    fontSize: 14,
    color: '#666',
  },
  labelButtonTextActive: {
    color: '#FFFFFF',
  },
  formFooter: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  saveAddressButton: {
    backgroundColor: '#CCCCCC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveAddressButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});