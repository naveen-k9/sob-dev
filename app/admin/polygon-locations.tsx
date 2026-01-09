import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MapView, { Polygon as MapPolygon, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Polygon, ServiceableLocation } from '@/types';
import {
  fetchServiceableLocations as fbFetchServiceableLocations,
  createServiceableLocation as fbCreateServiceableLocation,
  deleteServiceableLocation as fbDeleteServiceableLocation,
} from '@/services/firebase';

const COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D92'
];

const INITIAL_REGION: Region = {
  latitude: 17.385044,
  longitude: 78.486671,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function PolygonLocations() {
  const mapRef = useRef<MapView>(null);
  const [savedLocations, setSavedLocations] = useState<ServiceableLocation[]>([]);
  const [loadingPolygons, setLoadingPolygons] = useState(true);
  const [currentPolygon, setCurrentPolygon] = useState<Polygon | null>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [showNameModal, setShowNameModal] = useState(false);
  const [polygonName, setPolygonName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('29');
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch serviceable locations from Firebase on mount
  const loadLocations = useCallback(async () => {
    try {
      setLoadingPolygons(true);
      const data = await fbFetchServiceableLocations();
      // Only show locations that have polygon data
      setSavedLocations(data.filter(loc => loc.polygon && loc.polygon.length > 0));
    } catch (error) {
      console.error('Error loading locations:', error);
      Alert.alert('Error', 'Failed to load locations from server');
    } finally {
      setLoadingPolygons(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
    getCurrentLocation();
  }, [loadLocations]);

  const getCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.log('Location error:', error);
    } finally {
      setIsLocating(false);
    }
  };

  const getRandomColor = () => {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    if (!currentPolygon) {
      const newPolygon: Polygon = {
        id: Date.now().toString(),
        points: [{ latitude, longitude }],
        color: getRandomColor(),
        name: '',
        completed: false,
      };
      setCurrentPolygon(newPolygon);
    } else if (currentPolygon.points.length < 4) {
      const updatedPolygon = {
        ...currentPolygon,
        points: [...currentPolygon.points, { latitude, longitude }],
      };
      setCurrentPolygon(updatedPolygon);

      if (updatedPolygon.points.length === 4) {
        setShowNameModal(true);
      }
    }
  };

  const savePolygon = async () => {
    if (!currentPolygon || !polygonName.trim()) return;

    // Calculate center point of polygon
    const centerLat = currentPolygon.points.reduce((sum, p) => sum + p.latitude, 0) / currentPolygon.points.length;
    const centerLng = currentPolygon.points.reduce((sum, p) => sum + p.longitude, 0) / currentPolygon.points.length;

    // Create a ServiceableLocation with the polygon data
    const newLocation: ServiceableLocation = {
      id: Date.now().toString(),
      name: polygonName.trim(),
      coordinates: {
        latitude: centerLat,
        longitude: centerLng,
      },
      radius: 5, // Default radius
      deliveryFee: parseFloat(deliveryFee) || 29,
      isActive: true,
      polygon: currentPolygon.points,
    };

    try {
      setIsSaving(true);
      // Save to Firebase as ServiceableLocation
      await fbCreateServiceableLocation(newLocation);
      // Update local state
      setSavedLocations([...savedLocations, newLocation]);
      setCurrentPolygon(null);
      setPolygonName('');
      setDeliveryFee('29');
      setShowNameModal(false);
      Alert.alert('Success', 'Location saved to cloud successfully!');
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelCurrentPolygon = () => {
    setCurrentPolygon(null);
    setPolygonName('');
    setDeliveryFee('29');
    setShowNameModal(false);
  };

  const undoLastPoint = () => {
    if (currentPolygon && currentPolygon.points.length > 0) {
      const updatedPoints = currentPolygon.points.slice(0, -1);
      if (updatedPoints.length === 0) {
        setCurrentPolygon(null);
      } else {
        setCurrentPolygon({ ...currentPolygon, points: updatedPoints });
      }
    }
  };

  if (loadingPolygons) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Polygon Area</Text>
        <TouchableOpacity onPress={getCurrentLocation} style={styles.locationButton}>
          {isLocating ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="locate" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {currentPolygon
            ? `Tap ${4 - currentPolygon.points.length} more point${4 - currentPolygon.points.length !== 1 ? 's' : ''} to complete the polygon`
            : 'Tap on the map to start drawing a polygon (4 points)'}
        </Text>
        {currentPolygon && (
          <View style={styles.pointCounter}>
            <View style={[styles.pointDot, { backgroundColor: currentPolygon.color }]} />
            <Text style={styles.pointCountText}>{currentPolygon.points.length}/4 points</Text>
          </View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {/* Saved location polygons */}
          {savedLocations.map((location, index) => {
            const color = COLORS[index % COLORS.length];
            return location.polygon ? (
              <MapPolygon
                key={location.id}
                coordinates={location.polygon}
                fillColor={`${color}30`}
                strokeColor={color}
                strokeWidth={2}
              />
            ) : null;
          })}

          {/* Current polygon being drawn */}
          {currentPolygon && currentPolygon.points.length >= 3 && (
            <MapPolygon
              coordinates={currentPolygon.points}
              fillColor={`${currentPolygon.color}30`}
              strokeColor={currentPolygon.color}
              strokeWidth={2}
            />
          )}

          {/* Markers for current polygon points */}
          {currentPolygon?.points.map((point, index) => (
            <Marker
              key={`marker-${index}`}
              coordinate={point}
              pinColor={currentPolygon.color}
            >
              <View style={[styles.markerContainer, { backgroundColor: currentPolygon.color }]}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Bottom Actions */}
      {currentPolygon && (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.undoButton} onPress={undoLastPoint}>
            <Ionicons name="arrow-undo" size={20} color="#FF3B30" />
            <Text style={styles.undoText}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelCurrentPolygon}>
            <Ionicons name="close" size={20} color="#8E8E93" />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Saved Locations Count */}
      {savedLocations.length > 0 && !currentPolygon && (
        <View style={styles.savedInfo}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          <Text style={styles.savedText}>{savedLocations.length} location{savedLocations.length !== 1 ? 's' : ''} saved</Text>
        </View>
      )}

      {/* Save Location Modal */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Service Area</Text>
            <Text style={styles.modalLabel}>Location Name</Text>
            <TextInput
              style={styles.modalInput}
              value={polygonName}
              onChangeText={setPolygonName}
              placeholder="e.g., Hitech City Zone"
              placeholderTextColor="#C7C7CC"
              autoFocus
            />
            <Text style={styles.modalLabel}>Delivery Fee (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              placeholder="e.g., 29"
              placeholderTextColor="#C7C7CC"
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={cancelCurrentPolygon} disabled={isSaving}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, (!polygonName.trim() || isSaving) && styles.modalSaveDisabled]}
                onPress={savePolygon}
                disabled={!polygonName.trim() || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  locationButton: {
    padding: 4,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#3C3C43',
  },
  pointCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  pointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  pointCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  undoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    marginRight: 8,
  },
  undoText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    marginLeft: 8,
  },
  cancelText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  savedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
  },
  savedText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C43',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalSaveDisabled: {
    backgroundColor: '#C7C7CC',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
