import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAsyncStorage } from "@/hooks/useStorage";
import { Address, Polygon } from "@/types";
import { useActiveAddress } from "@/contexts/ActiveAddressContext";
import { useLocation } from "@/contexts/LocationContext";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";

interface LocationServiceProps {
  polygons?: Polygon[]; // Now optional, we use LocationContext instead
  onLocationSet?: (location: {
    latitude: number;
    longitude: number;
    address: string;
    isServiceable: boolean;
  }) => void;
  disableAutoDetection?: boolean; // Prevent auto location detection
}

interface CurrentLocationState {
  latitude: number;
  longitude: number;
  address: string;
  isServiceable: boolean;
  serviceablePolygons: Array<{ id: string; name: string; color: string }>;
}

const LocationService: React.FC<LocationServiceProps> = ({
  polygons,
  onLocationSet,
  disableAutoDetection = false,
}) => {
  const [addresses, setAddresses] = useAsyncStorage<Address[]>("addresses", []);
  const { getDisplayAddress, setCurrentLocationAddress } = useActiveAddress();
  const { checkLocationServiceability, locationState } = useLocation();
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocationState | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showNonServiceableModal, setShowNonServiceableModal] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] =
    useState<string>("unknown");
  const [hasShownNonServiceableMessage, setHasShownNonServiceableMessage] =
    useAsyncStorage<boolean>("hasShownNonServiceableMessage", false);

  // Auto-detect location on component mount (only if not disabled)
  useEffect(() => {
    if (!disableAutoDetection) {
      detectCurrentLocation();
    }
  }, [disableAutoDetection]);

  // Check if current location matches any saved address
  useEffect(() => {
    if (currentLocation && addresses.length > 0) {
      const matchingAddress = findMatchingAddress(currentLocation);
      if (matchingAddress) {
        setSelectedAddress(matchingAddress);
      }
    }
  }, [currentLocation, addresses]);

  const detectCurrentLocation = async () => {
    try {
      setIsDetectingLocation(true);

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is needed to detect your current location and provide delivery services.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Location.requestForegroundPermissionsAsync(),
            },
          ]
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Reverse geocode to get address
      let addressText = "Current Location";
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync(coords);
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          addressText = `${addr.name || addr.street || ""}, ${
            addr.city || ""
          }, ${addr.region || ""}`.trim();
          if (addressText === ", ,") {
            addressText = "Current Location";
          }
        }
      } catch (geocodeError) {
        console.warn("Reverse geocoding failed:", geocodeError);
      }

      // Check serviceability using LocationContext (fetches from Firebase)
      const isServiceable = await checkLocationServiceability(coords);
      console.log("[LocationService] Serviceability check result:", isServiceable);

      const currentLocationState: CurrentLocationState = {
        ...coords,
        address: addressText,
        isServiceable,
        serviceablePolygons: [], // No longer using local polygon list
      };

      setCurrentLocation(currentLocationState);

      // Create an Address object for the current location
      const currentLocationAddress: Address = {
        id: "current-location",
        userId: "",
        type: "other",
        label: "Current Location",
        name: "Current Location",
        phone: "",
        phoneNumber: "",
        addressLine: "",
        addressText: addressText,
        street: "",
        city: "",
        state: "",
        pincode: "",
        coordinates: coords,
        isDefault: false,
        createdAt: new Date(),
      };

      // Set current location address in context
      setCurrentLocationAddress(currentLocationAddress);

      // Show non-serviceable modal if location is not serviceable
      // Only show on first launch (persist state to avoid annoying users)
      if (!isServiceable && !hasShownNonServiceableMessage) {
        setShowNonServiceableModal(true);
        setHasShownNonServiceableMessage(true);
      }

      // Notify parent component
      onLocationSet?.({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: addressText,
        isServiceable,
      });
    } catch (error) {
      console.error("Location detection error:", error);

      let errorMessage = "Failed to detect your location. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage =
            "Location detection timed out. Please ensure GPS is enabled and try again.";
        } else if (error.message.includes("unavailable")) {
          errorMessage =
            "Location services are unavailable. Please enable GPS in your device settings.";
        }
      }

      Alert.alert("Location Error", errorMessage, [
        { text: "Retry", onPress: detectCurrentLocation },
        {
          text: "Select Manually",
          onPress: () => router.push("/location/select"),
        },
      ]);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const findMatchingAddress = (
    location: CurrentLocationState
  ): Address | null => {
    const MATCH_THRESHOLD = 0.001; // ~100 meters

    return (
      addresses.find((address) => {
        const distance = Math.sqrt(
          Math.pow(address.coordinates.latitude - location.latitude, 2) +
            Math.pow(address.coordinates.longitude - location.longitude, 2)
        );
        return distance <= MATCH_THRESHOLD;
      }) || null
    );
  };

  const handleSelectLocation = () => {
    router.push("/location/select");
  };

  const handleMoveToServiceableArea = () => {
    setShowNonServiceableModal(false);
    router.push({
      pathname: "/location/select",
      params: { mode: "pin", showOnlyServiceable: "true" },
    });
  };

  const renderLocationDisplay = () => {
    const displayAddress = getDisplayAddress();

    if (isDetectingLocation) {
      return (
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={handleSelectLocation}
        >
          <ActivityIndicator size="small" color="#FFFFFF" />
          <View style={styles.addressTextContainer}>
            <Text style={styles.locationLabel}>Detecting...</Text>
            <Text style={styles.locationAddress}>Finding your location</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (!displayAddress) {
      return (
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={handleSelectLocation}
        >
          <Ionicons name="location-outline" size={20} color="#FFFFFF" />
          <View style={styles.addressTextContainer}>
            <Text style={styles.locationLabel}>Select Location</Text>
            <Text style={styles.locationAddress}>
              Choose your delivery area
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }

    // Check if the display address is serviceable using LocationContext
    // If we have a selected location in context and it matches, use that status
    // Otherwise, assume serviceable for display purposes (actual check happens on detection)
    const isServiceable = locationState.isLocationServiceable || 
      (locationState.selectedLocation !== null);

    return (
      <TouchableOpacity
        style={styles.locationContainer}
        onPress={handleSelectLocation}
      >
        <Ionicons name="location" size={27} color="#FFFFFF" />
        <View style={styles.addressTextContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.locationLabel} numberOfLines={1}>
              {displayAddress.type === "home"
                ? "Home"
                : displayAddress.type === "work"
                ? "Work"
                : displayAddress.name}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.locationAddress} numberOfLines={1}>
            {displayAddress.addressText ||
              `${displayAddress.street}, ${displayAddress.city}`}
          </Text>
        </View>
        {!isServiceable && <View style={styles.warningDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {renderLocationDisplay()}

      {/* Non-serviceable location modal */}
      <Modal
        visible={showNonServiceableModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNonServiceableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="location-outline" size={48} color="#FF3B30" />
              <Text style={styles.modalTitle}>Area Not Serviceable</Text>
            </View>

            <Text style={styles.modalDescription}>
              Your current location is outside our delivery area. You can move
              the pin to a nearby serviceable location to continue.
            </Text>

            {currentLocation?.serviceablePolygons.length === 0 &&
              (polygons?.length ?? 0) > 0 && (
                <View style={styles.serviceableAreasContainer}>
                  <Text style={styles.serviceableAreasTitle}>
                    Available Service Areas:
                  </Text>
                  {(polygons ?? []).slice(0, 3).map((polygon) => (
                    <Text key={polygon.id} style={styles.serviceableAreaName}>
                      • {polygon.name}
                    </Text>
                  ))}
                  {(polygons ?? []).length > 3 && (
                    <Text style={styles.serviceableAreaName}>
                      • And {(polygons ?? []).length - 3} more areas
                    </Text>
                  )}
                </View>
              )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.notifyButton]}
                onPress={() => {
                  setShowNonServiceableModal(false);
                  router.push("/service-area-request");
                }}
              >
                <Ionicons name="notifications-outline" size={18} color="#48479B" />
                <Text style={styles.notifyButtonText}>Notify Me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={handleMoveToServiceableArea}
              >
                <Text style={styles.primaryButtonText}>
                  Choose Serviceable Area
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.continueLink}
              onPress={() => setShowNonServiceableModal(false)}
            >
              <Text style={styles.continueLinkText}>Continue browsing anyway</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 0,
    maxWidth: 220,
  },
  addressTextContainer: {
    flex: 1,
    marginHorizontal: 8,
    justifyContent: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.8)",
  },
  locationText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primary,
    marginHorizontal: 6,
    flex: 1,
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3B30",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  serviceableAreasContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  serviceableAreasTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  serviceableAreaName: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#F2F2F7",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  notifyButton: {
    backgroundColor: "#F8F9FF",
    borderWidth: 1.5,
    borderColor: "#48479B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#48479B",
  },
  continueLink: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  continueLinkText: {
    fontSize: 14,
    color: "#8E8E93",
    textDecorationLine: "underline",
  },
});

export default React.memo(LocationService);
