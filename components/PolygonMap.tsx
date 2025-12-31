import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MapPin, Plus, Trash2 } from 'lucide-react-native';
import { Polygon } from '@/types';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface PolygonMapProps {
  polygons: Polygon[];
  currentPolygon: Polygon | null;
  onMapPress: (coordinate: { latitude: number; longitude: number }) => void;
  region: Region;
  onRegionChange: (region: Region) => void;
}

// Predefined location areas for Hyderabad
const PRESET_AREAS = [
  { name: 'Hitech City', latitude: 17.4435, longitude: 78.3772 },
  { name: 'Madhapur', latitude: 17.4486, longitude: 78.3908 },
  { name: 'Gachibowli', latitude: 17.4401, longitude: 78.3489 },
  { name: 'Kondapur', latitude: 17.4592, longitude: 78.3573 },
  { name: 'Jubilee Hills', latitude: 17.4325, longitude: 78.4073 },
  { name: 'Banjara Hills', latitude: 17.4156, longitude: 78.4347 },
  { name: 'Kukatpally', latitude: 17.4849, longitude: 78.3883 },
  { name: 'Miyapur', latitude: 17.4969, longitude: 78.3548 },
];

const PolygonMap: React.FC<PolygonMapProps> = ({
  polygons,
  currentPolygon,
  onMapPress,
  region,
  onRegionChange,
}) => {
  const [selectedPoints, setSelectedPoints] = useState<number[]>([]);

  const handleAreaSelect = (area: typeof PRESET_AREAS[0], index: number) => {
    // Add small offset to create polygon corners
    const offset = 0.005;
    const cornerOffsets = [
      { lat: offset, lng: -offset },   // top-left
      { lat: offset, lng: offset },    // top-right
      { lat: -offset, lng: offset },   // bottom-right
      { lat: -offset, lng: -offset },  // bottom-left
    ];

    const pointIndex = currentPolygon ? currentPolygon.points.length : 0;
    if (pointIndex < 4) {
      const corner = cornerOffsets[pointIndex];
      onMapPress({
        latitude: area.latitude + corner.lat,
        longitude: area.longitude + corner.lng,
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <MapPin size={32} color="#007AFF" />
          <Text style={styles.title}>Create Polygon Area</Text>
          <Text style={styles.subtitle}>
            Select 4 corners to define your delivery zone
          </Text>
        </View>

        {/* Current polygon status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>
            Points: {currentPolygon ? currentPolygon.points.length : 0} / 4
          </Text>
          {currentPolygon && currentPolygon.points.length > 0 && (
            <View style={styles.pointsList}>
              {currentPolygon.points.map((point, idx) => (
                <View key={idx} style={styles.pointItem}>
                  <View style={[styles.pointDot, { backgroundColor: currentPolygon.color }]} />
                  <Text style={styles.pointText}>
                    Corner {idx + 1}: {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Area selection */}
        <Text style={styles.sectionTitle}>
          Tap to add corner point ({currentPolygon ? 4 - currentPolygon.points.length : 4} remaining):
        </Text>
        
        <View style={styles.areasGrid}>
          {PRESET_AREAS.map((area, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.areaButton,
                currentPolygon && currentPolygon.points.length >= 4 && styles.areaButtonDisabled
              ]}
              onPress={() => handleAreaSelect(area, index)}
              disabled={currentPolygon ? currentPolygon.points.length >= 4 : false}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.areaButtonText}>{area.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Saved polygons */}
        {polygons.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.sectionTitle}>Saved Polygons ({polygons.length})</Text>
            {polygons.map((polygon) => (
              <View key={polygon.id} style={styles.savedPolygon}>
                <View style={[styles.polygonColor, { backgroundColor: polygon.color }]} />
                <Text style={styles.polygonName}>{polygon.name}</Text>
                <Text style={styles.polygonPoints}>{polygon.points.length} points</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  pointsList: {
    marginTop: 8,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  pointText: {
    fontSize: 13,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  areasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 24,
  },
  areaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    margin: 4,
  },
  areaButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  areaButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  savedSection: {
    marginTop: 8,
  },
  savedPolygon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  polygonColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  polygonName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  polygonPoints: {
    fontSize: 13,
    color: '#8E8E93',
  },
});

export default PolygonMap;