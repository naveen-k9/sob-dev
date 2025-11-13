import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
}

interface AddressSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (result: SearchResult) => void;
  initialQuery?: string;
}

const AddressSearchModal: React.FC<AddressSearchModalProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialQuery = "",
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([
    {
      id: "1",
      title: "Naveen Nagar",
      description: "Naveen Nagar, Banjara Hills, Hyderabad, Telangana, India",
      latitude: 17.4239,
      longitude: 78.4738,
    },
    {
      id: "2",
      title: "Naveen gold & bros",
      description:
        "Naveen gold & bros, Ruby Block, Brundavan Colony, Bolarum, Hyderabad, Telangana, India",
      latitude: 17.4951,
      longitude: 78.4956,
    },
    {
      id: "3",
      title: "Naveena Monty School",
      description: "Naveena Monty School, Secunderabad, Telangana, India",
      latitude: 17.4399,
      longitude: 78.4983,
    },
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const slideAnimation = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Focus on search input after animation
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 350);
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
      setShowSuggestions(true);
    }
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSuggestions(true);
      return;
    }

    try {
      setIsSearching(true);
      setShowSuggestions(false);

      // Using Expo Location for geocoding
      const results = await Location.geocodeAsync(query + ", Hyderabad, India");

      const formattedResults: SearchResult[] = results
        .slice(0, 5)
        .map((result, index) => ({
          id: `search_${index}`,
          title: query,
          description: `${query}, Hyderabad, Telangana, India`,
          latitude: result.latitude,
          longitude: result.longitude,
        }));

      // Add some popular places if searching for common terms
      if (query.toLowerCase().includes("naveen")) {
        formattedResults.unshift(...recentSearches);
      }

      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    // Add to recent searches if not already there
    const isAlreadyRecent = recentSearches.find(
      (item) => item.id === result.id
    );
    if (!isAlreadyRecent) {
      const newRecents = [result, ...recentSearches.slice(0, 4)];
      setRecentSearches(newRecents);
    }

    onLocationSelect(result);
    onClose();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSuggestions(true);
    searchInputRef.current?.focus();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (showSuggestions && searchQuery.length === 0) {
      return (
        <ScrollView
          style={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {recentSearches.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.resultItem}
              onPress={() => handleResultSelect(item)}
            >
              <View style={styles.resultIcon}>
                <Ionicons name="time-outline" size={20} color="#8E8E93" />
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              <TouchableOpacity style={styles.resultArrow}>
                <Ionicons name="arrow-up-outline" size={16} color="#8E8E93" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    if (searchResults.length > 0) {
      return (
        <ScrollView
          style={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        >
          {searchResults.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.resultItem}
              onPress={() => handleResultSelect(item)}
            >
              <View style={styles.resultIcon}>
                <Ionicons name="location-outline" size={20} color="#8E8E93" />
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    if (searchQuery.length > 0 && searchResults.length === 0 && !isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubText}>
            Try searching with different keywords
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
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
                    outputRange: [600, 0],
                  }),
                },
              ],
              opacity: slideAnimation,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Address</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#8E8E93" />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Naveen"
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={() => handleSearch(searchQuery)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch}>
                  <Ionicons name="close-circle" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Results */}
          <View style={styles.contentContainer}>{renderSearchResults()}</View>

          {/* Bottom Safe Area */}
          <View style={styles.bottomSafeArea} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
    minHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  closeButton: {
    padding: 4,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
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
  contentContainer: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 2,
  },
  resultDescription: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 18,
  },
  resultArrow: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  bottomSafeArea: {
    height: Platform.OS === "ios" ? 34 : 16,
    backgroundColor: "#FFFFFF",
  },
});

export default AddressSearchModal;
