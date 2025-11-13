import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
  Keyboard,
} from "react-native";
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
  const initialLat = params.latitude
    ? parseFloat(params.latitude as string)
    : 17.385044;
  const initialLng = params.longitude
    ? parseFloat(params.longitude as string)
    : 78.486671;
  const mode = params.mode as string;

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [selectedLocation, setSelectedLocation] = useState({
    latitude: initialLat,
    longitude: initialLng,
  });

  const [currentAddress, setCurrentAddress] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const searchBarAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Get address for initial location
    reverseGeocode(initialLat, initialLng);
  }, []);

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
    setMapRegion((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
    reverseGeocode(latitude, longitude);
  };

  const handleSearchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      // Using Expo Location for geocoding
      const results = await Location.geocodeAsync(query + ", Hyderabad, India");

      const formattedResults = results.map((result, index) => ({
        id: index.toString(),
        title: query,
        description: "Hyderabad, Telangana, India",
        latitude: result.latitude,
        longitude: result.longitude,
      }));

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
    if (onLocationConfirm) {
      onLocationConfirm({
        ...selectedLocation,
        address: currentAddress,
      });
    }

    // Navigate to add address form
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
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

      mapRef.current?.animateToRegion(newRegion, 1000);
      reverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      Alert.alert("Error", "Failed to get current location");
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
          region={mapRegion}
          onPress={handleMapPress}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          <Marker
            coordinate={selectedLocation}
            title="Selected Location"
            description={currentAddress}
          />
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
        >
          <Ionicons name="locate" size={24} color="#007AFF" />
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
          <Text style={styles.addressTitle}>
            {currentAddress || "Balaji Nagar Main Road"}
          </Text>
          <Text style={styles.addressSubtitle}>
            Kukatpally, APHB Colony, Hyderabad
          </Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmLocation}
          disabled={isLoadingAddress}
        >
          {isLoadingAddress ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          )}
        </TouchableOpacity>
      </View>
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
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default MapLocationScreen;
