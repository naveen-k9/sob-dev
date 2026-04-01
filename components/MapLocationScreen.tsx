import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useLocation } from "@/contexts/LocationContext";
import ServiceAreaRequestModal from "@/components/ServiceAreaRequestModal";

interface MapLocationScreenProps {
  onBack?: () => void;
  onLocationConfirm?: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

const DEFAULT_REGION: Region = {
  latitude: 17.385,
  longitude: 78.4867,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MapLocationScreen: React.FC<MapLocationScreenProps> = ({
  onBack,
  onLocationConfirm,
}) => {
  const params = useLocalSearchParams();
  const { checkLocationServiceability } = useLocation();
  const [showNonServiceableModal, setShowNonServiceableModal] = useState(false);
  const hasParamsCoords = !!(params.latitude && params.longitude);

  const initialLat = hasParamsCoords ? parseFloat(params.latitude as string) : null;
  const initialLng = hasParamsCoords ? parseFloat(params.longitude as string) : null;
  const mode = params.mode as string;

  const [mapRegion, setMapRegion] = useState<Region>(
    hasParamsCoords && initialLat !== null && initialLng !== null
      ? { latitude: initialLat, longitude: initialLng, latitudeDelta: 0.005, longitudeDelta: 0.005 }
      : DEFAULT_REGION
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
  const [isMapDragging, setIsMapDragging] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const searchBarAnimation = useRef(new Animated.Value(0)).current;
  const loadingOverlayOpacity = useRef(new Animated.Value(hasParamsCoords ? 0 : 1)).current;
  const pinTranslateY = useRef(new Animated.Value(0)).current;
  const pinScale = useRef(new Animated.Value(1)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const locateBtnSpin = useRef(new Animated.Value(0)).current;
  const addressShimmer = useRef(new Animated.Value(0)).current;

  // Shimmer loop for address loading
  useEffect(() => {
    if (isLoadingAddress) {
      const loop = Animated.loop(
        Animated.timing(addressShimmer, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: false })
      );
      loop.start();
      return () => loop.stop();
    }
    addressShimmer.setValue(0);
  }, [isLoadingAddress]);

  // Fade loading overlay in/out
  useEffect(() => {
    Animated.timing(loadingOverlayOpacity, {
      toValue: isLoadingLocation ? 1 : 0,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isLoadingLocation]);

  // Spin locate button icon while fetching
  useEffect(() => {
    if (isLoadingLocation) {
      const loop = Animated.loop(
        Animated.timing(locateBtnSpin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
      );
      loop.start();
      return () => { loop.stop(); locateBtnSpin.setValue(0); };
    }
    locateBtnSpin.setValue(0);
  }, [isLoadingLocation]);

  // Animate pin: lift on drag, drop+bounce on settle
  useEffect(() => {
    if (isMapDragging) {
      Animated.parallel([
        Animated.spring(pinTranslateY, { toValue: -14, useNativeDriver: true, speed: 28, bounciness: 0 }),
        Animated.spring(pinScale, { toValue: 1.15, useNativeDriver: true, speed: 28, bounciness: 0 }),
        Animated.spring(shadowScale, { toValue: 1.4, useNativeDriver: true, speed: 28, bounciness: 0 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(pinTranslateY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 10 }),
        Animated.spring(pinScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
        Animated.spring(shadowScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 }),
      ]).start();
    }
  }, [isMapDragging]);

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

        mapRef.current?.animateToRegion(region, 800);
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
    Animated.timing(searchBarAnimation, {
      toValue: showSearchBar ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSearchBar]);

  const reverseGeocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      setIsLoadingAddress(true);
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });

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
  }, []);

  const handleRegionChange = useCallback(() => {
    setIsMapDragging(true);
    setIsLoadingAddress(true);
  }, []);

  const handleRegionChangeComplete = useCallback((region: Region) => {
    setIsMapDragging(false);
    setMapRegion(region);
    const { latitude, longitude } = region;
    setSelectedLocation({ latitude, longitude });

    if (reverseGeocodeTimer.current) clearTimeout(reverseGeocodeTimer.current);
    reverseGeocodeTimer.current = setTimeout(() => {
      reverseGeocode(latitude, longitude);
    }, 300);
  }, [reverseGeocode]);

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

  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;
    const isServiceable = await checkLocationServiceability(selectedLocation);
    if (!isServiceable) {
      setShowNonServiceableModal(true);
      return;
    }
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
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
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
    <>
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
      {locationPermissionDenied && !selectedLocation && (
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
      <Animated.View
        style={[styles.loadingOverlay, { opacity: loadingOverlayOpacity }]}
        pointerEvents={isLoadingLocation ? "auto" : "none"}
      >
        <View style={styles.loadingPulse}>
          <Ionicons name="navigate-circle-outline" size={52} color="#48479B" />
        </View>
        <ActivityIndicator size="small" color="#48479B" style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Finding your location…</Text>
      </Animated.View>

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
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={false}
        />

        {/* Center Pin Overlay */}
        <View style={styles.centerMarkerContainer} pointerEvents="none">
          <Animated.View style={[
            styles.pinShadow,
            { transform: [{ scaleX: shadowScale }, { scaleY: Animated.multiply(shadowScale, 0.4) }] },
          ]} />
          <Animated.View style={[
            styles.centerMarker,
            { transform: [{ translateY: pinTranslateY }, { scale: pinScale }] },
          ]}>
            <Ionicons name="pin-outline" size={36} color="#48479B" />
          </Animated.View>
        </View>

        {/* My Location Button */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handleMyLocation}
          disabled={isLoadingLocation}
          activeOpacity={0.7}
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color="#48479B" />
          ) : (
            <Animated.View style={{
              transform: [{
                rotate: locateBtnSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
              }],
            }}>
              <Ionicons name="locate" size={24} color="#48479B" />
            </Animated.View>
          )}
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
          {isLoadingAddress ? (
            <View style={styles.addressShimmerWrap}>
              <Animated.View style={[styles.addressShimmerBar, { width: '75%' }, {
                opacity: addressShimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.25, 0.6, 0.25] }),
              }]} />
              <Animated.View style={[styles.addressShimmerBar, { width: '50%', marginTop: 8 }, {
                opacity: addressShimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.5, 0.2] }),
              }]} />
            </View>
          ) : (
            <Text style={styles.addressTitle} numberOfLines={2}>
              {currentAddress || "Move the map to select location"}
            </Text>
          )}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmButton, (!selectedLocation || isLoadingAddress) && styles.confirmButtonDisabled]}
          onPress={handleConfirmLocation}
          disabled={!selectedLocation || isLoadingAddress}
          activeOpacity={0.8}
        >
          {isLoadingAddress ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>

    <ServiceAreaRequestModal
      visible={showNonServiceableModal}
      onClose={() => setShowNonServiceableModal(false)}
      onNotifyMe={() => {
        setShowNonServiceableModal(false);
        router.push("/service-area-request");
      }}
      onChooseServiceableArea={() => setShowNonServiceableModal(false)}
      showContinueBrowsing={false}
      description="This area is not yet serviceable. Move the pin to a serviceable location or get notified when we expand here."
    />
    </>
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
    marginLeft: -18,
    marginTop: -36,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  centerMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  pinShadow: {
    position: "absolute",
    bottom: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.15)",
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
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
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingPulse: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F0EFFE",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  addressShimmerWrap: {
    paddingVertical: 4,
  },
  addressShimmerBar: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E5E7EB",
  },
});

export default MapLocationScreen;
