import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationDetector from '@/components/LocationDetector';
import { useAsyncStorage } from '@/hooks/useStorage';
import { Polygon } from '@/types';

export default function LocationDetectionScreen() {
  const [polygons, , loadingPolygons] = useAsyncStorage<Polygon[]>('polygons', []);

  if (loadingPolygons) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Location Detection</Text>
        <Text style={styles.subtitle}>
          Check if your location is in a serviceable area
        </Text>
      </View>
      <LocationDetector polygons={polygons.filter(p => p.completed)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
}); 