import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (result: SearchResult) => void;
  initialQuery?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GOOGLE_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
  "";

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/** Google Places Autocomplete – returns up to 5 real-time suggestions */
async function autocompletePlaces(query: string): Promise<PlacePrediction[]> {
  if (!GOOGLE_KEY) throw new Error("No Google API key configured");
  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
    `?input=${encodeURIComponent(query)}` +
    `&key=${GOOGLE_KEY}` +
    `&components=country:in` +
    `&language=en`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status === "OK" || data.status === "ZERO_RESULTS") {
    return data.predictions ?? [];
  }
  throw new Error(`Places Autocomplete error: ${data.status} – ${data.error_message ?? ""}`);
}

/** Google Place Details – gets lat/lng for a place_id */
async function getPlaceDetails(
  placeId: string
): Promise<{ latitude: number; longitude: number; name: string; formattedAddress: string }> {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}` +
    `&fields=geometry,name,formatted_address` +
    `&key=${GOOGLE_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK") throw new Error(`Place Details error: ${data.status}`);

  const loc = data.result.geometry.location;
  return {
    latitude: loc.lat,
    longitude: loc.lng,
    name: data.result.name ?? "",
    formattedAddress: data.result.formatted_address ?? "",
  };
}

/**
 * Fallback: Google Geocoding API – less interactive but works when Places
 * API is not enabled on the key.
 */
async function geocodeFallback(query: string): Promise<SearchResult[]> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(query)}` +
    `&key=${GOOGLE_KEY}` +
    `&components=country:IN` +
    `&region=in`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Geocode error: ${data.status}`);
  }

  return (data.results ?? []).slice(0, 8).map((r: any, i: number) => {
    const parts = r.formatted_address.split(",");
    const title = parts[0]?.trim() ?? r.formatted_address;
    const description = parts.slice(1).join(",").trim();
    return {
      id: r.place_id ?? String(i),
      title,
      description,
      latitude: r.geometry.location.lat,
      longitude: r.geometry.location.lng,
    };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AddressSearchModal: React.FC<AddressSearchModalProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialQuery = "",
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [fallbackResults, setFallbackResults] = useState<SearchResult[]>([]);
  const [useFallback, setUseFallback] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchInputRef = useRef<TextInput | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery(initialQuery);
      setPredictions([]);
      setFallbackResults([]);
      setError(null);
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [visible]);

  // Debounced search triggered on every query change
  const triggerSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q.trim()) {
      setPredictions([]);
      setFallbackResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      try {
        if (!useFallback) {
          // Primary: Google Places Autocomplete
          const preds = await autocompletePlaces(q);
          setPredictions(preds);
          if (preds.length === 0) setError("No places found. Try a different search.");
        } else {
          // Fallback: Google Geocoding (when Places API not enabled)
          const results = await geocodeFallback(q);
          setFallbackResults(results);
          if (results.length === 0) setError("No places found. Try a different search.");
        }
      } catch (e: any) {
        console.log("[AddressSearch] search error:", e?.message ?? e);

        // If Places API failed, switch to Geocoding fallback
        if (!useFallback) {
          console.log("[AddressSearch] Switching to geocoding fallback");
          setUseFallback(true);
          try {
            const results = await geocodeFallback(q);
            setFallbackResults(results);
            if (results.length === 0) setError("No places found.");
          } catch (e2: any) {
            console.log("[AddressSearch] fallback also failed:", e2?.message);
            setError("Search failed. Check your connection.");
          }
        } else {
          setError("Search failed. Check your connection.");
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);
  }, [useFallback]);

  useEffect(() => {
    triggerSearch(searchQuery);
  }, [searchQuery, triggerSearch]);

  // ----- Selection handlers -----

  /** Called when user picks a Google Places Autocomplete prediction */
  const handlePredictionSelect = async (pred: PlacePrediction) => {
    Keyboard.dismiss();
    setIsFetchingDetails(true);
    try {
      const details = await getPlaceDetails(pred.place_id);
      const result: SearchResult = {
        id: pred.place_id,
        title: pred.structured_formatting.main_text,
        description: pred.structured_formatting.secondary_text || details.formattedAddress,
        latitude: details.latitude,
        longitude: details.longitude,
      };
      saveAndSelect(result);
    } catch (e) {
      console.log("[AddressSearch] details fetch error:", e);
      // On details failure, try geocoding the description directly
      try {
        const fallback = await geocodeFallback(pred.description);
        if (fallback.length > 0) saveAndSelect(fallback[0]);
        else setError("Could not get location details.");
      } catch {
        setError("Could not get location details.");
      }
    } finally {
      setIsFetchingDetails(false);
    }
  };

  /** Called when user picks a Geocoding fallback result */
  const handleFallbackSelect = (result: SearchResult) => {
    Keyboard.dismiss();
    saveAndSelect(result);
  };

  const saveAndSelect = (result: SearchResult) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((r) => r.id !== result.id);
      return [result, ...filtered].slice(0, 5);
    });
    onLocationSelect(result);
    onClose();
  };

  // ----- Current location -----
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;

      const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
      let title = "Current Location";
      let description = "";
      if (rev.length > 0) {
        const a = rev[0];
        title = [a.name, a.street].filter(Boolean).join(", ") || "Current Location";
        description = [a.district, a.city, a.region].filter(Boolean).join(", ");
      }
      saveAndSelect({ id: "current_location", title, description, latitude, longitude });
    } catch (e) {
      setError("Could not get your location.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleClear = () => {
    setSearchQuery("");
    setPredictions([]);
    setFallbackResults([]);
    setError(null);
    searchInputRef.current?.focus();
  };

  // ----- Derived -----
  const hasQuery = searchQuery.trim().length > 0;
  const hasResults = useFallback ? fallbackResults.length > 0 : predictions.length > 0;
  const showRecents = !hasQuery && recentSearches.length > 0;

  // ----- Renders -----
  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handlePredictionSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultIcon}>
        <Ionicons name="location-outline" size={20} color="#48479B" />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.structured_formatting.main_text}
        </Text>
        <Text style={styles.resultDescription} numberOfLines={2}>
          {item.structured_formatting.secondary_text}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const renderFallback = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleFallbackSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultIcon}>
        <Ionicons name="location-outline" size={20} color="#48479B" />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultDescription} numberOfLines={2}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const renderRecent = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => saveAndSelect(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.resultIcon, { backgroundColor: "#F5F5F5" }]}>
        <Ionicons name="time-outline" size={20} color="#8E8E93" />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultDescription} numberOfLines={1}>{item.description}</Text>
      </View>
      <Ionicons name="arrow-up-outline" size={16} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.title}>Search Address</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search area, street, landmark…"
              placeholderTextColor="#ADADAD"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="never"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color="#48479B" />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={handleClear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color="#ADADAD" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Use Current Location */}
        <TouchableOpacity
          style={styles.currentLocationRow}
          onPress={handleUseCurrentLocation}
          disabled={isLocating}
          activeOpacity={0.7}
        >
          {isLocating ? (
            <ActivityIndicator
              size="small"
              color="#48479B"
              style={{ marginRight: 12 }}
            />
          ) : (
            <View style={styles.currentLocationIcon}>
              <Ionicons name="navigate" size={18} color="#48479B" />
            </View>
          )}
          <View>
            <Text style={styles.currentLocationTitle}>Use current location</Text>
            <Text style={styles.currentLocationSub}>GPS will pinpoint your position</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#C7C7CC"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Fetching details overlay */}
        {isFetchingDetails && (
          <View style={styles.detailsOverlay}>
            <ActivityIndicator color="#48479B" />
            <Text style={styles.detailsText}>Getting location…</Text>
          </View>
        )}

        {/* Error */}
        {error && !isSearching && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {hasQuery ? (
          isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#48479B" />
              <Text style={styles.loadingText}>Searching…</Text>
            </View>
          ) : hasResults ? (
            useFallback ? (
              <FlatList
                data={fallbackResults}
                keyExtractor={(item) => item.id}
                renderItem={renderFallback}
                keyboardShouldPersistTaps="always"
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={{ paddingBottom: 32 }}
              />
            ) : (
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                renderItem={renderPrediction}
                keyboardShouldPersistTaps="always"
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={{ paddingBottom: 32 }}
              />
            )
          ) : !error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={44} color="#C7C7CC" />
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubText}>
                Try a different area name, landmark, or pincode
              </Text>
            </View>
          ) : null
        ) : showRecents ? (
          <>
            <Text style={styles.sectionLabel}>Recent Searches</Text>
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item.id}
              renderItem={renderRecent}
              keyboardShouldPersistTaps="always"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={44} color="#E8E8E8" />
            <Text style={styles.emptyText}>Find your location</Text>
            <Text style={styles.emptySubText}>
              Type an area, landmark, or street above
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 16 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 12,
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700", color: "#111" },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#48479B",
    shadowColor: "#48479B",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#111" },
  currentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  currentLocationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationTitle: { fontSize: 15, fontWeight: "700", color: "#48479B" },
  currentLocationSub: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  divider: { height: 6, backgroundColor: "#F5F5F5" },
  detailsOverlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF9F9",
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  detailsText: { color: "#48479B", fontSize: 13 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FEF2F2",
  },
  errorText: { color: "#EF4444", fontSize: 13, flex: 1 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultContent: { flex: 1 },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  resultDescription: { fontSize: 13, color: "#8E8E93", lineHeight: 18 },
  separator: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginLeft: 64,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
    gap: 12,
  },
  loadingText: { fontSize: 15, color: "#8E8E93" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default AddressSearchModal;
