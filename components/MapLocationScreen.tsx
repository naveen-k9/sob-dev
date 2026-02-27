import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";

interface MapLocationScreenProps {
  onBack?: () => void;
  onLocationConfirm?: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

const MapLocationScreen: React.FC<MapLocationScreenProps> = ({
  onBack,
  onLocationConfirm,
}) => {
  const params = useLocalSearchParams();
  const hasParamsCoords = !!(params.latitude && params.longitude);

  const initialLat = hasParamsCoords ? parseFloat(params.latitude as string) : null;
  const initialLng = hasParamsCoords ? parseFloat(params.longitude as string) : null;
  const mode = params.mode as string;

  // No default coordinates – map starts empty and locates device
  const [mapRegion, setMapRegion] = useState<Region | null>(
    hasParamsCoords && initialLat !== null && initialLng !== null
      ? { latitude: initialLat, longitude: initialLng, latitudeDelta: 0.005, longitudeDelta: 0.005 }
      : null
  );
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(
    hasParamsCoords && initialLat !== null && initialLng !== null
      ? { latitude: initialLat, longitude: initialLng }
      : null
  );
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  const [currentAddress, setCurrentAddress] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(!hasParamsCoords);

  const mapRef = useRef<MapView | null>(null);
  const searchBarAnimation = useRef(new Animated.Value(0)).current;

  // Get current location if no coordinates provided
  useEffect(() => {
    const initializeLocation = async () => {
      if (hasParamsCoords && initialLat !== null && initialLng !== null) {
        reverseGeocode(initialLat, initialLng);
        return;
      }

      try {
        setIsLoadingLocation(true);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationPermissionDenied(true);
          setIsLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;

        const region = { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 };
        setMapRegion(region);
        setSelectedLocation({ latitude, longitude });

        mapRef.current?.animateToRegion(region, 500);
        
        reverseGeocode(latitude, longitude);
      } catch (error) {
        console.error('[MapLocationScreen] Error getting location:', error);
        if (initialLat !== null && initialLng !== null) {
          reverseGeocode(initialLat, initialLng);
        }
      } finally {
        setIsLoadingLocation(false);
      }
    };

    initializeLocation();
  }, [hasParamsCoords]);

  useEffect(() => {
    // Animate search bar
    Animated.timing(searchBarAnimation, {
      toValue: showSearchBar ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSearchBar]);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      setIsLoadingAddress(true);
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result.length > 0) {
        const address = result[0];
        const formattedAddress = [
          address.streetNumber,
          address.street,
          address.district,
          address.city,
          address.region,
        ]
          .filter(Boolean)
          .join(", ");

        setCurrentAddress(formattedAddress || "Unknown location");
      } else {
        setCurrentAddress("Unknown location");
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setCurrentAddress("Unable to get address");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setMapRegion((prev) => prev ? { ...prev, latitude, longitude } : { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });
    reverseGeocode(latitude, longitude);
  };

  const handleSearchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await Location.geocodeAsync(query);

      const formattedResults = await Promise.all(
        results.map(async (result, index) => {
          let description = query;
          try {
            const rev = await Location.reverseGeocodeAsync({ latitude: result.latitude, longitude: result.longitude });
            if (rev.length > 0) {
              description = [rev[0].street, rev[0].district, rev[0].city, rev[0].region]
                .filter(Boolean)
                .join(", ") || query;
            }
          } catch {}
          return { id: index.toString(), title: query, description, latitude: result.latitude, longitude: result.longitude };
        })
      );

      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Geocoding failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultSelect = (result: any) => {
    const { latitude, longitude } = result;
    setSelectedLocation({ latitude, longitude });
    setMapRegion({
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });

    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      1000
    );

    reverseGeocode(latitude, longitude);
    setShowSearchBar(false);
    setSearchQuery("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation) return;
    if (onLocationConfirm) {
      onLocationConfirm({ ...selectedLocation, address: currentAddress });
    }
    router.push({
      pathname: "/location/add-address",
      params: {
        latitude: selectedLocation.latitude.toString(),
        longitude: selectedLocation.longitude.toString(),
        address: currentAddress,
      },
    });
  };

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleMyLocation = async () => {
    try {
      setIsLoadingLocation(true);
      console.log('[MapLocationScreen] Manual location request...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to detect your current location.'
        );
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setMapRegion(newRegion);

      mapRef.current?.animateToRegion(newRegion, 500);
      reverseGeocode(location.coords.latitude, location.coords.longitude);
      
      console.log('[MapLocationScreen] Location updated:', location.coords);
    } catch (error) {
      console.error('[MapLocationScreen] Location error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.'
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Location</Text>
        <TouchableOpacity
          onPress={() => setShowSearchBar(!showSearchBar)}
          style={styles.searchButton}
        >
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Permission denied state */}
      {locationPermissionDenied && !mapRegion && (
        <View style={styles.permissionDenied}>
          <Ionicons name="location-outline" size={48} color="#9CA3AF" />
          <Text style={styles.permissionTitle}>Location Access Required</Text>
          <Text style={styles.permissionSubtitle}>
            Please enable location permission to pick your delivery address on the map.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={handleMyLocation}>
            <Text style={styles.permissionBtnText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading overlay when fetching location */}
      {isLoadingLocation && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#48479B" />
          <Text style={styles.loadingText}>Finding your location…</Text>
        </View>
      )}

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            height: searchBarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 70],
            }),
            opacity: searchBarAnimation,
          },
        ]}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for apartment, street name..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearchAddress(text);
            }}
            autoFocus={showSearchBar}
          />
          {isSearching && <ActivityIndicator size="small" color="#8E8E93" />}
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.searchResultItem}
                onPress={() => handleSearchResultSelect(result)}
              >
                <Ionicons name="location-outline" size={20} color="#8E8E93" />
                <View style={styles.searchResultText}>
                  <Text style={styles.searchResultTitle}>{result.title}</Text>
                  <Text style={styles.searchResultDescription}>
                    {result.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Map */}
      {mapRegion && (
      <>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onPress={handleMapPress}
          onRegionChangeComplete={(r) => setMapRegion(r)}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Selected Location"
            description={currentAddress}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setSelectedLocation({ latitude, longitude });
              setMapRegion((prev) => prev ? { ...prev, latitude, longitude } : { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });
              reverseGeocode(latitude, longitude);
            }}
          />
          )}
        </MapView>

        {/* Center Pin Overlay */}
        <View style={styles.centerMarkerContainer}>
          <View style={styles.centerMarker}>
            <Ionicons name="location" size={30} color="#FF3B30" />
          </View>
        </View>

        {/* My Location Button */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handleMyLocation}
          disabled={isLoadingLocation}
        >
          <Ionicons 
            name="locate" 
            size={24} 
            color={isLoadingLocation ? "#999" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Address Info */}
      <View style={styles.addressInfoContainer}>

        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryBadge}>
            <Text style={styles.deliveryText}>
              Order will be delivered here
            </Text>
            <Text style={styles.deliverySubText}>
              Place the pin to your exact location
            </Text>
          </View>
        </View>

        <View style={styles.addressDetails}>
          <Text style={styles.addressTitle} numberOfLines={2}>
            {isLoadingAddress ? "Getting address…" : (currentAddress || "Move the pin to your location")}
          </Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmButton, (!selectedLocation || isLoadingAddress) && styles.confirmButtonDisabled]}
          onPress={handleConfirmLocation}
          disabled={!selectedLocation || isLoadingAddress}
        >
          {isLoadingAddress ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          )}
        </TouchableOpacity>
      </View>
      </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  searchButton: {
    padding: 4,
  },
  searchContainer: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  searchResults: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
    gap: 12,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 2,
  },
  searchResultDescription: {
    fontSize: 14,
    color: "#8E8E93",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  centerMarkerContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -15,
    marginTop: -30,
    alignItems: "center",
    justifyContent: "center",
  },
  centerMarker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addressInfoContainer: {
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  deliveryInfo: {
    marginBottom: 16,
  },
  deliveryBadge: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  deliveryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  deliverySubText: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  addressDetails: {
    marginBottom: 24,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  addressSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  confirmButton: {
    backgroundColor: "#48479B",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#48479B",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  confirmButtonDisabled: {
    backgroundColor: "#9CA3AF",
    elevation: 0,
    shadowOpacity: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  permissionDenied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  permissionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  permissionBtn: {
    marginTop: 8,
    backgroundColor: "#48479B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#48479B",
    fontWeight: "500",
  },
});

export default MapLocationScreen;
