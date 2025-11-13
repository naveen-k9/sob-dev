import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveAddress } from "@/contexts/ActiveAddressContext";
import { Address } from "@/types";

interface SelectLocationScreenProps {
  onBack?: () => void;
  onLocationSelect?: (address: Address | null) => void;
}

const SelectLocationScreen: React.FC<SelectLocationScreenProps> = ({
  onBack,
  onLocationSelect,
}) => {
  const { user } = useAuth();
  const { activeAddress, setActiveAddress } = useActiveAddress();
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
    }
  }, [user?.addresses]);

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

      // Navigate to map view to confirm location
      router.push({
        pathname: "/location/map-select",
        params: {
          latitude: location.coords.latitude.toString(),
          longitude: location.coords.longitude.toString(),
          mode: "current",
        },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to get current location. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleAddNewAddress = () => {
    router.push("/location/map-select?mode=new");
  };

  const handleRequestFromFriend = () => {
    // WhatsApp integration for requesting address
    Alert.alert(
      "Request Address",
      "This will open WhatsApp to request address from a friend",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open WhatsApp",
          onPress: () => {
            // Implement WhatsApp integration
            console.log("Opening WhatsApp to request address");
          },
        },
      ]
    );
  };

  const handleAddressSelect = (address: Address) => {
    setActiveAddress(address);
    if (onLocationSelect) {
      onLocationSelect(address);
    }
    if (onBack) {
      onBack();
    }
  };

  const formatDistance = (address: Address) => {
    // Calculate distance from current location if available
    // For now, return placeholder distances as shown in images
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

  const filteredAddresses = addresses.filter(
    (address) =>
      address.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.addressLine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Address"
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

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

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleRequestFromFriend}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </View>
            <Text style={styles.actionText}>Request address from friend</Text>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Saved Addresses */}
        {filteredAddresses.length > 0 && (
          <View style={styles.savedAddressesSection}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>

            {filteredAddresses.map((address) => (
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

        {filteredAddresses.length === 0 && searchQuery.length > 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>No addresses found</Text>
            <Text style={styles.emptySubText}>
              Try searching with different keywords
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#C7C7CC",
    textAlign: "center",
  },
});

export default SelectLocationScreen;
