import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
 
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import { Address } from "@/types";

interface AddAddressFormScreenProps {
  onBack?: () => void;
  onAddressAdded?: (address: Address) => void;
}

const AddAddressFormScreen: React.FC<AddAddressFormScreenProps> = ({
  onBack,
  onAddressAdded,
}) => {
  const params = useLocalSearchParams();
  const { user, addAddress } = useAuth();
  const { checkLocationServiceability } = useLocation();

  const latitude = params.latitude
    ? parseFloat(params.latitude as string)
    : 17.385044;
  const longitude = params.longitude
    ? parseFloat(params.longitude as string)
    : 78.486671;
  const initialAddress = (params.address as string) || "";

  const [formData, setFormData] = useState({
    houseNumber: "",
    building: "",
    landmark: "",
    addressLabel: "Home",
  });

  const [selectedAddressType, setSelectedAddressType] = useState<
    "Home" | "Work" | "Other"
  >("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [showCustomLabelInput, setShowCustomLabelInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = {
    latitude,
    longitude,
  };

  const mapRegion = {
    latitude,
    longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  useEffect(() => {
    if (selectedAddressType === "Other") {
      setShowCustomLabelInput(true);
    } else {
      setShowCustomLabelInput(false);
      setCustomLabel("");
    }
  }, [selectedAddressType]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressTypeSelect = (type: "Home" | "Work" | "Other") => {
    setSelectedAddressType(type);
  };

  const handleChangeLocation = () => {
    router.back();
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

    try {
      setIsSubmitting(true);

      // Check if location is serviceable before saving
      const isServiceable = await checkLocationServiceability({
        latitude,
        longitude,
      });

      if (!isServiceable) {
        setIsSubmitting(false);
        Alert.alert(
          "Area Not Serviceable Yet",
          "We're sorry, but we don't deliver to this location yet. We're constantly expanding our service areas. Would you like to get notified when we start serving this area?",
          [
            {
              text: "Maybe Later",
              style: "cancel",
            },
            {
              text: "Notify Me",
              onPress: () => {
                // Navigate to notify me request
                router.push('/notify-me');
              },
            },
          ]
        );
        return;
      }

      const newAddress: Omit<Address, "id"> = {
        userId: user?.id || "",
        type: selectedAddressType.toLowerCase() as "home" | "work" | "other",
        label:
          selectedAddressType === "Other" ? customLabel : selectedAddressType,
        name: formData.houseNumber,
        phone: user?.phone || "",
        phoneNumber: user?.phone || "",
        addressLine: [formData.houseNumber, formData.building, initialAddress]
          .filter(Boolean)
          .join(", "),
        addressText: [formData.houseNumber, formData.building, initialAddress]
          .filter(Boolean)
          .join(", "),
        street: initialAddress,
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500072",
        landmark: formData.landmark || undefined,
        isDefault: false,
        coordinates: {
          latitude,
          longitude,
        },
        createdAt: new Date(),
      };

      // Add address using auth context
      if (addAddress) {
        const savedAddress = await addAddress(newAddress);

        if (onAddressAdded) {
          onAddressAdded(savedAddress);
        }

        Alert.alert("Success", "Address saved successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to select location or home
              router.dismissAll();
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

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "Home":
        return "home";
      case "Work":
        return "business";
      default:
        return "location";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Address...</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Map Preview */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker coordinate={location} />
            </MapView>

            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleChangeLocation}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Location Info */}
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>APHB Colony</Text>
            <Text style={styles.locationSubtitle}>
              Kukatpally, APHB Colony, Hyderabad
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
                      selectedAddressType === type &&
                        styles.labelOptionSelected,
                    ]}
                    onPress={() =>
                      handleAddressTypeSelect(type as "Home" | "Work" | "Other")
                    }
                  >
                    <View style={styles.labelOptionContent}>
                      <Ionicons
                        name={getAddressTypeIcon(type)}
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
              {showCustomLabelInput && (
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
            style={[
              styles.saveButton,
              isSubmitting && styles.saveButtonDisabled,
            ]}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    backgroundColor: "#F2F2F7",
    position: "relative",
  },
  map: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
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

export default AddAddressFormScreen;
