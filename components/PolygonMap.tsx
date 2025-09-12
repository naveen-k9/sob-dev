import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import MapView, { Polygon as MapPolygon, Marker, Region } from 'react-native-maps';
import { Polygon } from '@/types';

interface PolygonMapProps {
  polygons: Polygon[];
  currentPolygon: Polygon | null;
  onMapPress: (coordinate: { latitude: number; longitude: number }) => void;
  region: Region;
  onRegionChange: (region: Region) => void;
}

const PolygonMap: React.FC<PolygonMapProps> = ({
  polygons,
  currentPolygon,
  onMapPress,
  region,
  onRegionChange,
}) => {
  const mapRef = useRef<MapView>(null);

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    onMapPress(coordinate);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.webContainer]}>
        {/* <View style={styles.webPlaceholder}>
          <Text style={styles.webText}>Map View (Native only)</Text>
          <Text style={styles.webSubText}>
            This feature requires react-native-maps which is not available on web
          </Text>
        </View> */}only on mobile
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChange}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Render completed polygons */}
        {polygons.map((polygon) => (
          <MapPolygon
            key={polygon.id}
            coordinates={polygon.points}
            fillColor={`${polygon.color}40`}
            strokeColor={polygon.color}
            strokeWidth={2}
          />
        ))}

        {/* Render current polygon being drawn */}
        {currentPolygon && currentPolygon.points.length >= 3 && (
          <MapPolygon
            coordinates={currentPolygon.points}
            fillColor={`${currentPolygon.color}40`}
            strokeColor={currentPolygon.color}
            strokeWidth={2}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Render markers for current polygon points */}
        {currentPolygon?.points.map((point, index) => (
          <Marker
            key={index}
            coordinate={point}
            pinColor={currentPolygon.color}
            title={`Point ${index + 1}`}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
});

export default PolygonMap;