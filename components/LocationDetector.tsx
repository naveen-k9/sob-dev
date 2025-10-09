import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Polygon as MapPolygon, Region } from 'react-native-maps';
import { Polygon } from '@/types';
import { findPolygonsContainingPoint } from '@/utils/polygonUtils';

interface LocationDetectorProps {
  polygons: Polygon[];
}

const LocationDetector: React.FC<LocationDetectorProps> = ({ polygons }) => {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceablePolygons, setServiceablePolygons] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const mapRef = useRef<MapView | null>(null);
  const initialRegion: Region = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to detect your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

  setCurrentLocation(coords);
  // Animate map to currentLocation whenever it changes
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [currentLocation]);

      // Check if location is in any polygon
      const containingPolygons = findPolygonsContainingPoint(coords, polygons);
      setServiceablePolygons(containingPolygons);

    } catch (error) {
      Alert.alert('Error', 'Failed to get current location. Please try again.');
      console.error('Location error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentLocation) {
      const containingPolygons = findPolygonsContainingPoint(currentLocation, polygons);
      setServiceablePolygons(containingPolygons);
    }
  }, [polygons, currentLocation]);

  const MapComponent = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.mapContainer, styles.webContainer]}>
          <View style={styles.webPlaceholder}>
            <Text style={styles.webText}>Map View (Native only)</Text>
            <Text style={styles.webSubText}>
              This feature requires react-native-maps which is not available on web
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          ref={mapRef}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {/* Render all polygons */}
          {polygons.map((polygon) => (
            <MapPolygon
              key={polygon.id}
              coordinates={polygon.points}
              fillColor={`${polygon.color}40`}
              strokeColor={polygon.color}
              strokeWidth={2}
            />
          ))}

          {/* Render current location marker */}
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              draggable
             
              title="Your Location"
              description={
                serviceablePolygons.length > 0
                  ? `Serviceable area: ${serviceablePolygons.map(p => p.name).join(', ')}`
                  : 'Not in serviceable area'
              }
            >
              <View style={[
                styles.locationMarker,
                { backgroundColor: serviceablePolygons.length > 0 ? '#34C759' : '#FF3B30' }
              ]}>
                <Ionicons 
                  name="person" 
                  size={16} 
                  color="#FFFFFF" 
                />
              </View>
            </Marker>
          )}
        </MapView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapComponent />
      
      <View style={styles.controlPanel}>
        <TouchableOpacity
          style={styles.detectButton}
          onPress={getCurrentLocation}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="locate" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.detectButtonText}>
            {isLoading ? 'Detecting...' : 'Detect My Location'}
          </Text>
        </TouchableOpacity>

        {currentLocation && (
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusCard,
              { backgroundColor: serviceablePolygons.length > 0 ? '#E8F5E8' : '#FFEBEE' }
            ]}>
              <View style={styles.statusHeader}>
                <Ionicons 
                  name={serviceablePolygons.length > 0 ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={serviceablePolygons.length > 0 ? '#34C759' : '#FF3B30'} 
                />
                <Text style={[
                  styles.statusTitle,
                  { color: serviceablePolygons.length > 0 ? '#34C759' : '#FF3B30' }
                ]}>
                  {serviceablePolygons.length > 0 ? 'Area Serviceable' : 'Area Not Serviceable'}
                </Text>
              </View>
              
              <Text style={styles.statusDescription}>
                {serviceablePolygons.length > 0
                  ? `Your location is within ${serviceablePolygons.length} service area${serviceablePolygons.length > 1 ? 's' : ''}.`
                  : 'Your current location is outside all marked service areas.'
                }
              </Text>

              {serviceablePolygons.length > 0 && (
                <View style={styles.polygonsList}>
                  <Text style={styles.polygonsListTitle}>Service Areas:</Text>
                  {serviceablePolygons.map((polygon) => (
                    <View key={polygon.id} style={styles.polygonItem}>
                      <View 
                        style={[styles.polygonColor, { backgroundColor: polygon.color }]} 
                      />
                      <Text style={styles.polygonName}>{polygon.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.coordinatesContainer}>
                <Text style={styles.coordinatesLabel}>Your Location:</Text>
                <Text style={styles.coordinatesText}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!currentLocation && !isLoading && (
          <View style={styles.instructionsContainer}>
            <Ionicons name="information-circle-outline" size={24} color="#8E8E93" />
            <Text style={styles.instructionsText}>
              Tap "Detect My Location" to check if your current location is within any marked service areas.
            </Text>
          </View>
        )}

        {polygons.length === 0 && (
          <View style={styles.noPolygonsContainer}>
            <Ionicons name="shapes-outline" size={32} color="#C7C7CC" />
            <Text style={styles.noPolygonsText}>No Service Areas Defined</Text>
            <Text style={styles.noPolygonsSubText}>
              Go to the Polygons tab to mark service areas first.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  webPlaceholder: {
    padding: 40,
    alignItems: 'center',
  },
  webText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  webSubText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  locationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  controlPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    lineHeight: 20,
  },
  polygonsList: {
    marginBottom: 16,
  },
  polygonsListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  polygonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  polygonColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  polygonName: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  coordinatesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    padding: 12,
  },
  coordinatesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#1C1C1E',
    fontFamily: 'monospace',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  noPolygonsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noPolygonsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
    marginBottom: 8,
  },
  noPolygonsSubText: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
});

export default LocationDetector;