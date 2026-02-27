import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveAddress } from "@/contexts/ActiveAddressContext";
import { Address } from "@/types";
import AddressSearchModal from "./AddressSearchModal";

type FlowStep = "select" | "map" | "form" | "search";

interface LocationFlowProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected?: (address: Address) => void;
  initialStep?: FlowStep;
}

const LocationFlow: React.FC<LocationFlowProps> = ({
  visible,
  onClose,
  onLocationSelected,
  initialStep = "select",
}) => {
  const { user, addAddress } = useAuth();
  const { activeAddress, setActiveAddress } = useActiveAddress();

  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>(initialStep);
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Map state
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    houseNumber: "",
    building: "",
    landmark: "",
  });
  const [selectedAddressType, setSelectedAddressType] = useState<
    "Home" | "Work" | "Other"
  >("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search modal state
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Animation
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
    }
  }, [user?.addresses]);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Auto-detect location when map step is shown
  useEffect(() => {
    const initializeMapLocation = async () => {
      if (currentStep !== 'map' || hasInitializedLocation) return;

      try {
        console.log('[LocationFlow] Auto-detecting location for map...');
        setIsLoadingLocation(true);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('[LocationFlow] Location permission denied');
          setIsLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;
        console.log('[LocationFlow] Current location detected:', latitude, longitude);
        
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        setSelectedLocation({ latitude, longitude });
        setHasInitializedLocation(true);
        
        // Animate map to location
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 500);
        
        reverseGeocode(latitude, longitude);
      } catch (error) {
        console.error('[LocationFlow] Error getting location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    initializeMapLocation();
  }, [currentStep, hasInitializedLocation]);

  // Utility functions
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

  const formatDistance = (address: Address) => {
    if (address.type === "home") return "12 m";
    return "10.9 km";
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return "home";
      case "work":
        return "business";
      default:
        return "location";
    }
  };

  // Step 1: Select Location handlers
  const handleUseCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to use current location."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      await reverseGeocode(location.coords.latitude, location.coords.longitude);
      setCurrentStep("map");
    } catch (error) {
      Alert.alert("Error", "Failed to get current location. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleAddNewAddress = () => {
    setCurrentStep("map");
  };

  const handleAddressSelect = (address: Address) => {
    setActiveAddress(address);
    if (onLocationSelected) {
      onLocationSelected(address);
    }
    onClose();
  };

  const handleSearchPress = () => {
    setShowSearchModal(true);
  };

  // Step 2: Map handlers
  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  const handleConfirmLocation = () => {
    setCurrentStep("form");
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

  // Step 3: Form handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressTypeSelect = (type: "Home" | "Work" | "Other") => {
    setSelectedAddressType(type);
  };

  const validateForm = () => {
    if (!formData.houseNumber.trim()) {
      Alert.alert("Error", "Please enter House No. & Floor");
      return false;
    }

    if (selectedAddressType === "Other" && !customLabel.trim()) {
      Alert.alert("Error", "Please enter a custom label for this address");
      return false;
    }

    return true;
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) return;
    if (!selectedLocation) {
      Alert.alert("Error", "Please select a location on the map first.");
      return;
    }

    try {
      setIsSubmitting(true);

      const newAddress: Omit<Address, "id"> = {
        userId: user?.id || "",
        type: selectedAddressType.toLowerCase() as "home" | "work" | "other",
        label:
          selectedAddressType === "Other" ? customLabel : selectedAddressType,
        name: formData.houseNumber,
        phone: user?.phone || "",
        phoneNumber: user?.phone || "",
        addressLine: [formData.houseNumber, formData.building, currentAddress]
          .filter(Boolean)
          .join(", "),
        addressText: [formData.houseNumber, formData.building, currentAddress]
          .filter(Boolean)
          .join(", "),
        street: currentAddress,
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500072",
        landmark: formData.landmark || undefined,
        isDefault: false,
        coordinates: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        },
        createdAt: new Date(),
      };

      if (addAddress) {
        const savedAddress = await addAddress(newAddress);

        if (onLocationSelected) {
          onLocationSelected(savedAddress);
        }

        Alert.alert("Success", "Address saved successfully!", [
          {
            text: "OK",
            onPress: () => {
              onClose();
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error saving address:", error);
      Alert.alert("Error", "Failed to save address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search handlers
  const handleSearchLocationSelect = (result: any) => {
    setSelectedLocation({
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setMapRegion({
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });

    setCurrentAddress(result.description);
    setShowSearchModal(false);
    setCurrentStep("map");
  };

  // Navigation handlers
  const handleBack = () => {
    switch (currentStep) {
      case "map":
        setCurrentStep("select");
        break;
      case "form":
        setCurrentStep("map");
        break;
      default:
        onClose();
    }
  };

  // Render functions
  const renderSelectStep = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={handleSearchPress}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <Text style={styles.searchPlaceholder}>Search Address</Text>
        </View>
      </TouchableOpacity>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleUseCurrentLocation}
            disabled={isLoadingLocation}
          >
            <View style={styles.actionIconContainer}>
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Ionicons name="locate" size={20} color="#FF3B30" />
              )}
            </View>
            <Text style={styles.actionText}>
              {isLoadingLocation
                ? "Getting location..."
                : "Use my Current Location"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleAddNewAddress}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add" size={20} color="#FF3B30" />
            </View>
            <Text style={styles.actionText}>Add New Address</Text>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.actionItem}>
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: "#E8F5E8" },
              ]}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </View>
            <Text style={styles.actionText}>Request address from friend</Text>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity> */}
        </View>

        {/* Saved Addresses */}
        {addresses.length > 0 && (
          <View style={styles.savedAddressesSection}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>

            {addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={styles.addressItem}
                onPress={() => handleAddressSelect(address)}
              >
                <View style={styles.addressContent}>
                  <View style={styles.addressIconContainer}>
                    <Ionicons
                      name={getAddressIcon(address.type)}
                      size={20}
                      color="#000"
                    />
                  </View>

                  <View style={styles.addressInfo}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressLabel}>
                        {address.type.charAt(0).toUpperCase() +
                          address.type.slice(1)}
                      </Text>
                      <Text style={styles.addressDistance}>
                        • {formatDistance(address)}
                      </Text>
                    </View>
                    <Text style={styles.addressText} numberOfLines={2}>
                      {address.addressLine}
                    </Text>
                  </View>

                  <View style={styles.addressActions}>
                    <TouchableOpacity style={styles.shareButton}>
                      <Ionicons
                        name="share-outline"
                        size={16}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.moreButton}>
                      <Ionicons
                        name="ellipsis-vertical"
                        size={16}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );

  const renderMapStep = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Location</Text>
        <TouchableOpacity
          onPress={handleSearchPress}
          style={styles.searchButton}
        >
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Loading location */}
      {isLoadingLocation && (
        <View style={styles.locationLoading}>
          <ActivityIndicator size="large" color="#48479B" />
          <Text style={styles.locationLoadingText}>Finding your location…</Text>
        </View>
      )}

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
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setSelectedLocation({ latitude, longitude });
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
          <Text style={styles.addressTitle} numberOfLines={2}>
            {isLoadingAddress ? "Getting address…" : (currentAddress || "Move the pin to your location")}
          </Text>
        </View>

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
    </>
  );

  const renderFormStep = () => (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Address...</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map Preview */}
        {mapRegion && selectedLocation && (
        <View style={styles.mapPreviewContainer}>
          <MapView
            style={styles.mapPreview}
            region={mapRegion}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Marker coordinate={selectedLocation} />
          </MapView>

          <TouchableOpacity style={styles.changeButton} onPress={handleBack}>
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle} numberOfLines={2}>
            {currentAddress || "Selected Location"}
          </Text>
        </View>

        {/* Address Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Add Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>House No. & Floor *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter house number and floor"
              placeholderTextColor="#C7C7CC"
              value={formData.houseNumber}
              onChangeText={(text) => handleInputChange("houseNumber", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Building & Block No. (Optional)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter building and block number"
              placeholderTextColor="#C7C7CC"
              value={formData.building}
              onChangeText={(text) => handleInputChange("building", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Landmark & Area Name (Optional)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter nearby landmark"
              placeholderTextColor="#C7C7CC"
              value={formData.landmark}
              onChangeText={(text) => handleInputChange("landmark", text)}
            />
          </View>

          {/* Address Label Selection */}
          <View style={styles.labelSection}>
            <Text style={styles.sectionTitle}>Add Address Label</Text>

            <View style={styles.labelOptions}>
              {["Home", "Work", "Other"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.labelOption,
                    selectedAddressType === type && styles.labelOptionSelected,
                  ]}
                  onPress={() =>
                    handleAddressTypeSelect(type as "Home" | "Work" | "Other")
                  }
                >
                  <View style={styles.labelOptionContent}>
                    <Ionicons
                      name={getAddressIcon(type.toLowerCase())}
                      size={20}
                      color={
                        selectedAddressType === type ? "#FF3B30" : "#8E8E93"
                      }
                    />
                    <Text
                      style={[
                        styles.labelOptionText,
                        selectedAddressType === type &&
                          styles.labelOptionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </View>
                  {selectedAddressType === type && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#FF3B30"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Label Input */}
            {selectedAddressType === "Other" && (
              <View style={styles.customLabelContainer}>
                <TextInput
                  style={styles.customLabelInput}
                  placeholder="Enter custom label (e.g., Mom's House, Gym)"
                  placeholderTextColor="#C7C7CC"
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  autoFocus={true}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSaveAddress}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE ADDRESS</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "select":
        return renderSelectStep();
      case "map":
        return renderMapStep();
      case "form":
        return renderFormStep();
      default:
        return renderSelectStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [800, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SafeAreaView style={styles.safeContainer}>
            {renderCurrentStep()}
          </SafeAreaView>
        </Animated.View>

        {/* Search Modal */}
        <AddressSearchModal
          visible={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onLocationSelect={handleSearchLocationSelect}
          initialQuery=""
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: 50,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  safeContainer: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
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
    marginHorizontal: 16,
  },
  searchButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F2F2F7",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#8E8E93",
  },
  content: {
    flex: 1,
  },
  quickActions: {
    paddingTop: 20,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  savedAddressesSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addressItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  addressContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  addressIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  addressDistance: {
    fontSize: 14,
    color: "#8E8E93",
    marginLeft: 4,
  },
  addressText: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  shareButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
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
  locationLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 32,
  },
  locationLoadingText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  mapPreviewContainer: {
    height: 200,
    backgroundColor: "#F2F2F7",
    position: "relative",
  },
  mapPreview: {
    flex: 1,
  },
  changeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#000",
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  locationInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  locationSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  textInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  labelSection: {
    marginTop: 32,
  },
  labelOptions: {
    gap: 16,
  },
  labelOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
  },
  labelOptionSelected: {
    borderColor: "#FF3B30",
    backgroundColor: "#FFF5F4",
  },
  labelOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  labelOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#8E8E93",
  },
  labelOptionTextSelected: {
    color: "#FF3B30",
  },
  customLabelContainer: {
    marginTop: 16,
  },
  customLabelInput: {
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#FFF5F4",
  },
  saveContainer: {
    padding: 16,
    paddingBottom: 34,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  saveButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});

export default LocationFlow;
