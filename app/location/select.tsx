import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useAsyncStorage } from '@/hooks/useStorage';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region, Polygon as MapPolygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '@/contexts/AuthContext';
import { Address, Polygon } from '@/types';
import { findPolygonsContainingPoint } from '@/utils/polygonUtils';
import { useActiveAddress } from '@/contexts/ActiveAddressContext';

export default function LocationSelectScreen() {
  const params = useLocalSearchParams();
  const mode = params.mode as string; // 'pin' for pin-based selection
  const showOnlyServiceable = params.showOnlyServiceable === 'true';
  const { setActiveAddress, setCurrentLocationAddress, isAddressActive } = useActiveAddress();

  // Auth context for user addresses
  const { user, updateUserAddresses } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
    }
  }, [user?.addresses]);
  const [polygons] = useAsyncStorage<Polygon[]>('polygons', []);
  const [showMapView, setShowMapView] = useState(mode === 'pin');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Location state
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    name: string;
    isServiceable: boolean;
  } | null>(null);
  
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 17.3850, // Hyderabad coordinates as shown in images
    longitude: 78.4867,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Address form state
  const [houseNumber, setHouseNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressLabel, setAddressLabel] = useState('home');

  // Notify modal state
  const [notifyName, setNotifyName] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmittingNotify, setIsSubmittingNotify] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [isModalTransitioning, setIsModalTransitioning] = useState(false);

  // Refs
  const mapRef = useRef<MapView | null>(null);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Distance calculation function
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get distance text
  const getDistanceText = (): string => {
    if (!currentLocation || !selectedLocation) return '';
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      selectedLocation.latitude,
      selectedLocation.longitude
    );
    
    if (distance < 10) return 'At current location';
    if (distance < 1000) return `${Math.round(distance)} meters away from current location`;
    return `${(distance / 1000).toFixed(1)} km away from current location`;
  };

  // Check if user needs to zoom in more for precise location
  const shouldShowZoomInstruction = (): boolean => {
    // Show zoom instruction if latitude delta is greater than 0.003 degrees
    // This roughly corresponds to a zoom level where GPS precision matters most
    // 0.003 degrees ≈ ~300 meters at the equator
    return mapRegion.latitudeDelta > 0.003 || mapRegion.longitudeDelta > 0.003;
  };

  // Google Places search function
  const searchGooglePlaces = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const apiKey = 'AIzaSyAz5QXMfoHQLZ_ZpWWqE_7OUrAIaYPSmi4'; // From Android manifest
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&components=country:IN`
      );
      
      const data = await response.json();
      
      if (data.predictions) {
        setSearchResults(data.predictions);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = async (placeId: string, description: string) => {
    try {
      const apiKey = 'AIzaSyAz5QXMfoHQLZ_ZpWWqE_7OUrAIaYPSmi4';
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=geometry,formatted_address,name`
      );
      
      const data = await response.json();
      
      if (data.result && data.result.geometry) {
        const location = data.result.geometry.location;
        
        // Animate map to selected location
        const newRegion = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
        
        // Check if location is serviceable
        const serviceablePolygons = findPolygonsContainingPoint(
          { latitude: location.lat, longitude: location.lng },
          polygons.filter(p => p.completed)
        );
        const isServiceable = serviceablePolygons.length > 0;
        
        console.log('Selected place location:', { latitude: location.lat, longitude: location.lng });
        console.log('Available polygons:', polygons.length);
        console.log('Completed polygons:', polygons.filter(p => p.completed).length);
        console.log('Serviceable polygons for place:', serviceablePolygons.length);
        console.log('Place is serviceable:', isServiceable);
        
        // Set selected location
        setSelectedLocation({
          latitude: location.lat,
          longitude: location.lng,
          address: data.result.formatted_address || description,
          name: data.result.name || 'Selected Location',
          isServiceable,
        });
        
        // Always close search drawer first
        setSearchQuery('');
        setShowSearchDrawer(false);
        setSearchResults([]);
        
        // If location is not serviceable, show notify modal after search drawer closes
        if (!isServiceable) {
          console.log('Location not serviceable, showing notify modal in 300ms');
          // Use setTimeout to ensure search modal is fully closed first
          setTimeout(() => {
            console.log('Opening notify modal now');
            setShowNotifyModal(true);
          }, 300); // Wait for modal close animation
        } else {
          console.log('Location is serviceable, not showing notify modal');
        }
      }
    } catch (error) {
      console.error('Place details error:', error);
      Alert.alert('Error', 'Failed to get location details. Please try again.');
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchGooglePlaces(searchQuery);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // If mode is pin, show map view immediately
  useEffect(() => {
    if (mode === 'pin') {
      setShowMapView(true);
    }
  }, [mode]);

  // Auto-get current location when map view opens (for Add New Address flow)
  useEffect(() => {
    if (showMapView && !currentLocation && !selectedLocation) {
      getCurrentLocation();
    }
  }, [showMapView]);

  // Debug effect to track search drawer state changes
  useEffect(() => {
    console.log('Search drawer state changed:', showSearchDrawer);
  }, [showSearchDrawer]);

  // Debug effect to track polygon loading
  useEffect(() => {
    console.log('Polygons loaded:', polygons.length);
    console.log('Completed polygons:', polygons.filter(p => p.completed).length);
    polygons.forEach((p, index) => {
      console.log(`Polygon ${index}:`, {
        id: p.id,
        name: p.name,
        completed: p.completed,
        pointsCount: p.points.length,
        color: p.color
      });
    });
  }, [polygons]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
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
      
      // Animate map to center on current location
      const newRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      
      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync(coords);
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
        
        // Check if location is serviceable
        const serviceablePolygons = findPolygonsContainingPoint(coords, polygons.filter((p: Polygon) => p.completed));
        const isServiceable = serviceablePolygons.length > 0;
        
        console.log('Current location coords:', coords);
        console.log('Available polygons:', polygons.length);
        console.log('Completed polygons:', polygons.filter((p: Polygon) => p.completed).length);
        console.log('Serviceable polygons found:', serviceablePolygons.length);
        console.log('Is serviceable:', isServiceable);
        
        setSelectedLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: formattedAddress,
          name: address.name || 'Current Location',
          isServiceable,
        });
      }

    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    // Get current location when user clicks this option
    await getCurrentLocation();
    
    if (currentLocation && selectedLocation) {
      // Create an Address object for the current location
      const currentLocationAddress: Address = {
        id: 'current-location',
        userId: '',
        type: 'other',
        label: 'Current Location',
        name: 'Current Location',
        phone: '',
        phoneNumber: '',
        addressLine: '',
        addressText: selectedLocation.address,
        street: '',
        city: '',
        state: '',
        pincode: '',
        coordinates: currentLocation,
        isDefault: false,
        createdAt: new Date(),
      };

      // Set as current location address (not active address)
      setCurrentLocationAddress(currentLocationAddress);
      
      router.back();
    }
  };

  const handleSelectSavedAddress = (address: Address) => {
    // Check if address is serviceable
  const serviceablePolygons = findPolygonsContainingPoint(address.coordinates, polygons.filter((p: Polygon) => p.completed));
    const isServiceable = serviceablePolygons.length > 0;
    
    if (showOnlyServiceable && !isServiceable) {
      Alert.alert(
        'Address Not Serviceable',
        'This saved address is outside our service area. Please choose a different address or add a new one in a serviceable location.'
      );
      return;
    }
    
    // Update current location to the selected address coordinates
    setCurrentLocation({
      latitude: address.coordinates.latitude,
      longitude: address.coordinates.longitude,
    });
    
    // Set the selected address as selectedLocation
    setSelectedLocation({
      latitude: address.coordinates.latitude,
      longitude: address.coordinates.longitude,
      address: address.addressText || address.addressLine,
      name: address.name,
      isServiceable,
    });

    // Set this address as the active address
    setActiveAddress(address);
    
    router.back();
  };

  const handleAddNewAddress = () => {
    // Just open the map view - we'll get current location after map opens
    setShowMapView(true);
  };

  const handleMapRegionChange = (region: Region) => {
    // Update local mapRegion state for internal tracking
    // but don't pass it back to the MapView (since we use initialRegion)
    setMapRegion(region);
    
    // Don't auto-close search drawer on map region changes
    // Let the user explicitly close it via the close button or back gesture
    
    // Update selected location based on map center
    const centerCoordinate = {
      latitude: region.latitude,
      longitude: region.longitude,
    };
    
    // Check if the new location is serviceable
    const serviceablePolygons = findPolygonsContainingPoint(centerCoordinate, polygons.filter((p: Polygon) => p.completed));
    const isServiceable = serviceablePolygons.length > 0;
    
    console.log('Map center changed to:', centerCoordinate);
    console.log('Map center serviceable polygons found:', serviceablePolygons.length);
    console.log('Map center is serviceable:', isServiceable);
    
    if (showOnlyServiceable && !isServiceable) {
      // Don't prevent map movement, just update the status
      setSelectedLocation(prev => prev ? {
        ...prev,
        latitude: centerCoordinate.latitude,
        longitude: centerCoordinate.longitude,
        isServiceable: false,
      } : null);
      return;
    }
    
    setSelectedLocation(prev => prev ? {
      ...prev,
      latitude: centerCoordinate.latitude,
      longitude: centerCoordinate.longitude,
      isServiceable,
    } : null);
    
    // Debounce reverse geocoding to avoid too many API calls
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    
    geocodeTimeoutRef.current = setTimeout(() => {
      Location.reverseGeocodeAsync(centerCoordinate)
        .then(result => {
          if (result.length > 0) {
            const address = result[0];
            const formattedAddress = `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
            
            setSelectedLocation(prev => prev ? {
              ...prev,
              address: formattedAddress,
              name: address.name || 'Selected Location',
            } : null);
          }
        })
        .catch(error => console.warn('Reverse geocoding failed:', error));
    }, 500); // 500ms debounce
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation) return;
    
    if (!selectedLocation.isServiceable) {
      Alert.alert(
        'Location Not Serviceable',
        'This location is outside our service area. Please choose a location within the highlighted service areas.'
      );
      return;
    }
    
    setShowAddressForm(true);
  };

  const handleSaveAddress = () => {
    if (!selectedLocation || !houseNumber.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    
    const newAddress: Address = {
      id: Date.now().toString(),
      userId: '',
      type: addressLabel as 'home' | 'work' | 'other',
      label: addressLabel,
      name: selectedLocation.name,
      phone: '',
      phoneNumber: '',
      addressLine: `${houseNumber}${landmark ? ', ' + landmark : ''}`,
      addressText: selectedLocation.address,
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark,
      coordinates: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      },
      isDefault: addresses.length === 0, // First address is default
      createdAt: new Date(),
    };

    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);
    updateUserAddresses(updatedAddresses);
    Alert.alert('Success', 'Address saved successfully!', [
      {
        text: 'OK',
        onPress: () => {
          router.back();
        }
      }
    ]);
  };

  const handleSubmitNotifyRequest = async () => {
    if (!notifyName.trim() || !notifyPhone.trim()) {
      Alert.alert('Missing Information', 'Please fill in your name and phone number.');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Error', 'No location selected.');
      return;
    }

    setIsSubmittingNotify(true);

    try {
      // Import Firebase function
      const { createServiceAreaNotificationRequest } = await import('@/services/firebase');
      
      const notifyRequest = {
        name: notifyName.trim(),
        phone: notifyPhone.trim(),
        email: notifyEmail.trim(),
        location: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address,
        },
        status: 'pending' as const,
        createdAt: new Date(),
      };

      // Save to Firebase
      const requestId = await createServiceAreaNotificationRequest(notifyRequest);
      
      console.log('Notification request saved with ID:', requestId);

      Alert.alert(
        'Request Submitted!', 
        'We will notify you when delivery service is available in your area.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsModalTransitioning(true);
              setShowNotifyModal(false);
              setNotifyName('');
              setNotifyPhone('');
              setNotifyEmail('');
              setTimeout(() => {
                setIsModalTransitioning(false);
                router.back();
              }, 300);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting notify request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmittingNotify(false);
    }
  };

  // Search Drawer Component
  const renderSearchDrawer = () => {
    console.log('Rendering search drawer, visible:', showSearchDrawer);
    console.log('Search query:', searchQuery);
    console.log('Is modal transitioning:', isModalTransitioning);
    return (
      <Modal
        visible={showSearchDrawer}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          console.log('Search drawer onRequestClose triggered');
          setShowSearchDrawer(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
      >
      <SafeAreaView style={styles.searchDrawerContainer}>
        {/* Search Header */}
        <View style={styles.searchDrawerHeader}>
          <TouchableOpacity
            style={styles.searchDrawerCloseButton}
            onPress={() => {
              console.log('Search drawer close button pressed');
              setShowSearchDrawer(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.searchDrawerTitle}>Search Places</Text>
          <View style={styles.searchDrawerCloseButton} />
        </View>
        
        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <View style={styles.searchDrawerBar}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchDrawerInput}
              placeholder="Search for places..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus={true}
            />
            {(searchQuery.length > 0 || isSearching) && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#8E8E93" />
                ) : (
                  <Ionicons name="close-circle" size={20} color="#8E8E93" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results */}
        <ScrollView 
          style={styles.searchDrawerResults} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isSearching && searchQuery.length >= 3 && (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.searchLoadingText}>Searching places...</Text>
            </View>
          )}
          
          {!isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
            <View style={styles.searchEmptyContainer}>
              <Ionicons name="location-outline" size={48} color="#8E8E93" />
              <Text style={styles.searchEmptyTitle}>No places found</Text>
              <Text style={styles.searchEmptySubtitle}>Try searching with different keywords</Text>
            </View>
          )}

          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={result.place_id || index}
              style={styles.searchDrawerResultItem}
              onPress={() => handleSearchResultSelect(result.place_id, result.description)}
            >
              <View style={styles.searchResultIcon}>
                <Ionicons name="location" size={20} color="#007AFF" />
              </View>
              <View style={styles.searchDrawerResultContent}>
                <Text style={styles.searchDrawerResultTitle}>
                  {result.structured_formatting?.main_text || result.description}
                </Text>
                <Text style={styles.searchDrawerResultSubtitle}>
                  {result.structured_formatting?.secondary_text || ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))}

          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <View style={styles.searchHintContainer}>
              <Text style={styles.searchHintText}>
                Type at least 3 characters to search for places
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
    );
  };

  if (showAddressForm) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Add Address Details' }} />
        
        <ScrollView style={styles.content}>
          <View style={styles.locationPreview}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.locationPreviewText}>
              {selectedLocation?.address}
            </Text>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Address Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>House/Flat Number *</Text>
              <TextInput
                style={styles.textInput}
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder="Enter house/flat number"
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Landmark (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Nearby landmark"
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Save as</Text>
              <View style={styles.labelOptions}>
                {['home', 'work', 'other'].map((label) => (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.labelOption,
                      addressLabel === label && styles.labelOptionActive
                    ]}
                    onPress={() => setAddressLabel(label)}
                  >
                    <Text style={[
                      styles.labelOptionText,
                      addressLabel === label && styles.labelOptionTextActive
                    ]}>
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setShowAddressForm(false)}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleSaveAddress}
          >
            <Text style={styles.primaryButtonText}>Save Address</Text>
          </TouchableOpacity>
        </View>
        {renderSearchDrawer()}
      </SafeAreaView>
    );
  }

  // NotifyMe Modal
  const renderNotifyModal = () => (
    <Modal
      visible={showNotifyModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowNotifyModal(false)}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowNotifyModal(false)}
          >
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Notify Me</Text>
          <View style={styles.modalCloseButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.notifyInfo}>
            <Ionicons name="information-circle" size={48} color="#FF9500" />
            <Text style={styles.notifyInfoTitle}>Area Not Serviceable</Text>
            <Text style={styles.notifyInfoDescription}>
              We don't deliver to this location yet, but we're expanding! 
              Leave your details and we'll notify you when delivery is available in your area.
            </Text>
          </View>

          <View style={styles.selectedLocationInfo}>
            <Ionicons name="location" size={20} color="#8E8E93" />
            <Text style={styles.selectedLocationText}>
              {selectedLocation?.address}
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.textInput}
                value={notifyName}
                onChangeText={setNotifyName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.textInput}
                value={notifyPhone}
                onChangeText={setNotifyPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={notifyEmail}
                onChangeText={setNotifyEmail}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <Text style={styles.notifyDisclaimer}>
              We'll contact you as soon as delivery service is available in your area. 
              Your information will only be used for service notifications.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setShowNotifyModal(false)}
            disabled={isSubmittingNotify}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleSubmitNotifyRequest}
            disabled={isSubmittingNotify}
          >
            {isSubmittingNotify ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (showMapView) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Select Location', headerShown: true }} />
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => {
              console.log('Search bar pressed, opening drawer...');
              if (!isModalTransitioning) {
                setShowSearchDrawer(true);
              }
            }}
            disabled={isModalTransitioning}
          >
            <Ionicons name="search" size={20} color="#8E8E93" />
            <Text style={styles.searchPlaceholder}>Search for places...</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.mapContainer}>
          {Platform.OS !== 'web' ? (
            <MapView
              style={styles.map}
              initialRegion={mapRegion}
              ref={mapRef}
              showsUserLocation={true}
              showsMyLocationButton={false}
              onRegionChangeComplete={handleMapRegionChange}
            >
              {/* Render serviceable area polygons */}
              {polygons
                .filter((p: Polygon) => p.completed)
                .map((polygon: Polygon) => (
                  <MapPolygon
                    key={polygon.id}
                    coordinates={polygon.points}
                    fillColor={`${polygon.color}20`}
                    strokeColor={polygon.color}
                    strokeWidth={2}
                  />
                ))}
                
              {/* Show current location marker if available */}
              {currentLocation && (
                <Marker
                  coordinate={currentLocation}
                  title="Current Location"
                  pinColor="#007AFF"
                >
                  <View style={styles.currentLocationMarker}>
                    <View style={styles.currentLocationDot} />
                  </View>
                </Marker>
              )}
            </MapView>
          ) : (
            <View style={styles.webMapPlaceholder}>
              <Text>Map view not available on web</Text>
            </View>
          )}
          
          {/* Static pin overlay in center of map */}
          <View style={styles.centerMarker}>
            <View style={[
              styles.pinContainer,
              { backgroundColor: selectedLocation?.isServiceable ? '#34C759' : '#FF3B30' }
            ]}>
              <Ionicons name="location" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.pinShadow} />
          </View>
          
          {/* Map controls */}
          <View style={styles.mapControls}>
            
            
            {/* Use Current Location Button */}
            <TouchableOpacity
              style={styles.useCurrentLocationButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              <Ionicons name="navigate" size={16} color="#007AFF" />
              <Text style={styles.useCurrentLocationText}>
                {isLoadingLocation ? 'Getting location...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Location info panel */}
          {selectedLocation && (
            <View style={styles.locationInfoPanel}>
              <View style={styles.mapInstructions}>
                {currentLocation && (
                  <Text style={styles.distanceText}>
                    {getDistanceText()}
                  </Text>
                )}
              </View>
              
              <View style={styles.locationInfo}>
                <Ionicons 
                  name={selectedLocation.isServiceable ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={selectedLocation.isServiceable ? "#34C759" : "#FF3B30"} 
                />
                <View style={styles.locationTextInfo}>
                  <Text style={styles.locationInfoAddress}>
                    {selectedLocation.address}
                  </Text>
                  <Text style={[
                    styles.locationInfoStatus,
                    { color: selectedLocation.isServiceable ? "#34C759" : "#FF3B30" }
                  ]}>
                    {selectedLocation.isServiceable ? "Serviceable area" : "Not serviceable"}
                  </Text>
                </View>
              </View>
              
              {(selectedLocation.isServiceable && shouldShowZoomInstruction()) ? (
                <TouchableOpacity
                  style={styles.zoomInstructionButton}
                  onPress={() => {
                    // Zoom in to a more precise level
                    if (mapRef.current) {
                      const zoomedRegion = {
                        ...mapRegion,
                        latitudeDelta: 0.002,
                        longitudeDelta: 0.002,
                      };
                      mapRef.current.animateToRegion(zoomedRegion, 500);
                    }
                  }}
                >
                  <Ionicons name="search" size={20} color="#FF9500" />
                  <Text style={styles.zoomInstructionButtonText}>
                    Zoom in to place pin at exact location
                  </Text>
                </TouchableOpacity>
              ) : selectedLocation.isServiceable ? (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmLocation}
                >
                  <Text style={styles.confirmButtonText}>Confirm Location</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.notifyButton}
                  onPress={() => {
                    console.log('Notify Me button pressed');
                    // Ensure no other modals are open
                    if (showSearchDrawer) {
                      console.log('Search drawer is open, closing first');
                      setShowSearchDrawer(false);
                      setSearchQuery('');
                      setSearchResults([]);
                      setTimeout(() => {
                        console.log('Opening notify modal after search drawer closes');
                        setShowNotifyModal(true);
                      }, 300);
                    } else {
                      console.log('Opening notify modal immediately');
                      setShowNotifyModal(true);
                    }
                  }}
                  disabled={isModalTransitioning}
                >
                  <Text style={styles.notifyButtonText}>Notify Me</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {renderSearchDrawer()}
      </SafeAreaView>
    );
  }

  // Main selection screen
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Select Location', headerShown: true }} />
      
      <ScrollView style={styles.content}>
        {/* Use Current Location */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleUseCurrentLocation}
          disabled={isLoadingLocation}
        >
          <View style={styles.optionIcon}>
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="locate" size={24} color="#007AFF" />
            )}
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Use Current Location</Text>
            <Text style={styles.optionSubtitle}>
              {isLoadingLocation 
                ? 'Detecting your location...'
                : currentLocation && selectedLocation?.address 
                  ? selectedLocation.address
                  : 'Tap to detect your current location'
              }
            </Text>
            {currentLocation && selectedLocation && !selectedLocation.isServiceable && (
              <Text style={styles.notServiceableText}>
                Not in serviceable area
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Add New Address */}
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

        {/* Saved Addresses */}
        {addresses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            {addresses.map((address) => {
              const isServiceable = findPolygonsContainingPoint(
                address.coordinates,
                polygons.filter((p: Polygon) => p.completed)
              ).length > 0;
              const isActive = isAddressActive(address.id);
              
              return (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressCard,
                    isActive && styles.activeAddressCard
                  ]}
                  onPress={() => handleSelectSavedAddress(address)}
                >
                  <View style={styles.addressIcon}>
                    <Ionicons 
                      name={address.type === 'home' ? "home" : address.type === 'work' ? "business" : "location"} 
                      size={20} 
                      color={isActive ? "#FFFFFF" : isServiceable ? "#007AFF" : "#8E8E93"} 
                    />
                  </View>
                  <View style={styles.addressContent}>
                    <View style={styles.addressTitleContainer}>
                      <Text style={[
                        styles.addressTitle,
                        isActive && styles.activeAddressTitle
                      ]}>
                        {address.name}
                      </Text>
                      {isActive && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.addressSubtitle,
                      isActive && styles.activeAddressSubtitle
                    ]}>
                      {address.addressLine}, {address.addressText}
                    </Text>
                    {!isServiceable && (
                      <Text style={styles.notServiceableText}>
                        Not in serviceable area
                      </Text>
                    )}
                  </View>
                  <Ionicons 
                    name={isActive ? "checkmark-circle" : "chevron-forward"} 
                    size={20} 
                    color={isActive ? "#FFFFFF" : "#C7C7CC"} 
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      {renderNotifyModal()}
      {renderSearchDrawer()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Option cards for main selection
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
  notServiceableText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  
  // Saved addresses section
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
  activeAddressCard: {
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#007AFF',
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
  activeAddressTitle: {
    color: '#FFFFFF',
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addressSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  activeAddressSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Map view styles
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 8,
  },
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  searchResultContent: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Search Drawer Styles
  searchDrawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchDrawerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  searchDrawerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchDrawerBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchDrawerInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 8,
  },
  searchDrawerResults: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchDrawerResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchDrawerResultContent: {
    flex: 1,
    marginLeft: 12,
  },
  searchDrawerResultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  searchDrawerResultSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  searchLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
  },
  searchLoadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  searchEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
  },
  searchEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  searchEmptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  searchHintContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
  },
  searchHintText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  locationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  currentLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -15,
    marginTop: -30,
    alignItems: 'center',
    zIndex: 1000,
  },
  pinContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pinShadow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginTop: 2,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 12,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  useCurrentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  useCurrentLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 6,
  },
  locationInfoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  mapInstructions: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  mapInstructionsText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  distanceText: {
    fontSize: 11,
    color: '#FF9500',
    fontWeight: '500',
    marginTop: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationTextInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationInfoAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  locationInfoStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notifyButton: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  zoomInstructionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  zoomInstructionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginLeft: 8,
    textAlign: 'center',
  },
  
  // Address form styles
  locationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  locationPreviewText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 8,
    flex: 1,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
  },
  labelOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  labelOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  labelOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  labelOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  labelOptionTextActive: {
    color: '#FFFFFF',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Modal styles
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  notifyInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  notifyInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  notifyInfoDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  selectedLocationText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 8,
    flex: 1,
  },
  notifyDisclaimer: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
    marginTop: 8,
  },
});