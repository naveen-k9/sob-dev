import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PolygonMap from '@/components/PolygonMap';
import PolygonList from '@/components/PolygonList';
import { useAsyncStorage } from '@/hooks/useStorage';
import { Polygon } from '@/types';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', 
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D92'
];

const INITIAL_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function PolygonSelector() {
  const [polygons, setPolygons, loadingPolygons] = useAsyncStorage<Polygon[]>('polygons', []);
  const [currentPolygon, setCurrentPolygon] = useState<Polygon | null>(null);
  const [showList, setShowList] = useState(false);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [showNameModal, setShowNameModal] = useState(false);
  const [polygonName, setPolygonName] = useState('');

  const getRandomColor = () => {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  const handleMapPress = useCallback((coordinate: { latitude: number; longitude: number }) => {
    if (!currentPolygon) {
      // Start new polygon
      const newPolygon: Polygon = {
        id: Date.now().toString(),
        points: [coordinate],
        color: getRandomColor(),
        name: '',
        completed: false,
      };
      setCurrentPolygon(newPolygon);
    } else {
      // Add point to current polygon
      const updatedPolygon = {
        ...currentPolygon,
        points: [...currentPolygon.points, coordinate],
      };
      setCurrentPolygon(updatedPolygon);

      // Complete polygon after 4 points
      if (updatedPolygon.points.length === 4) {
        setShowNameModal(true);
      }
    }
  }, [currentPolygon]);

  const savePolygon = () => {
    if (!currentPolygon || !polygonName.trim()) return;

    const completedPolygon: Polygon = {
      ...currentPolygon,
      name: polygonName.trim(),
      completed: true,
    };

    setPolygons([...polygons, completedPolygon]);
    setCurrentPolygon(null);
    setPolygonName('');
    setShowNameModal(false);
    
    Alert.alert('Success', 'Polygon saved successfully!');
  };

  const handleDeletePolygon = (id: string) => {
    const updatedPolygons = polygons.filter(p => p.id !== id);
    setPolygons(updatedPolygons);
  };

  const handleEditPolygon = (polygon: Polygon) => {
    Alert.alert('Edit Polygon', 'Edit functionality will be available in future updates.');
  };

  const cancelCurrentPolygon = () => {
    setCurrentPolygon(null);
    setPolygonName('');
    setShowNameModal(false);
  };

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
        <Text style={styles.title}>Polygon Selector</Text>
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => setShowList(!showList)}
        >
          <Ionicons 
            name={showList ? "map" : "list"} 
            size={20} 
            color="#007AFF" 
          />
          <Text style={styles.listButtonText}>
            {showList ? 'Map' : 'List'}
          </Text>
        </TouchableOpacity>
      </View>

      {showList ? (
        <PolygonList
          polygons={polygons}
          onDeletePolygon={handleDeletePolygon}
          onEditPolygon={handleEditPolygon}
        />
      ) : (
        <>
          <PolygonMap
            polygons={polygons}
            currentPolygon={currentPolygon}
            onMapPress={handleMapPress}
            region={region}
            onRegionChange={setRegion}
          />
          
          {currentPolygon && (
            <View style={styles.currentPolygonStatus}>
              <Text style={styles.statusText}>
                Point {currentPolygon.points.length}/4 - Tap to add {4 - currentPolygon.points.length} more points
              </Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelCurrentPolygon}
              >
                <Ionicons name="close" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Name Input Modal */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name Your Polygon</Text>
            <TextInput
              style={styles.modalInput}
              value={polygonName}
              onChangeText={setPolygonName}
              placeholder="Enter polygon name"
              placeholderTextColor="#C7C7CC"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={cancelCurrentPolygon}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={savePolygon}
                disabled={!polygonName.trim()}
              >
                <Text style={styles.modalSaveText}>Save</Text>
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
    backgroundColor: '#F2F2F7',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  listButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  currentPolygonStatus: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  cancelButton: {
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
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
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});