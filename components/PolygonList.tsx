import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Polygon } from '@/types';

interface PolygonListProps {
  polygons: Polygon[];
  onDeletePolygon: (id: string) => void;
  onEditPolygon: (polygon: Polygon) => void;
}

const PolygonList: React.FC<PolygonListProps> = ({
  polygons,
  onDeletePolygon,
  onEditPolygon,
}) => {
  const handleDelete = (polygon: Polygon) => {
    Alert.alert(
      'Delete Polygon',
      `Are you sure you want to delete "${polygon.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeletePolygon(polygon.id)
        },
      ]
    );
  };

  if (polygons.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="shapes-outline" size={48} color="#C7C7CC" />
        <Text style={styles.emptyText}>No polygons created yet</Text>
        <Text style={styles.emptySubText}>Tap on the map to start creating a polygon</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Saved Polygons ({polygons.length})</Text>
      {polygons.map((polygon) => (
        <View key={polygon.id} style={styles.polygonCard}>
          <View style={styles.polygonHeader}>
            <View style={styles.polygonInfo}>
              <View 
                style={[styles.colorIndicator, { backgroundColor: polygon.color }]} 
              />
              <View style={styles.polygonDetails}>
                <Text style={styles.polygonName}>{polygon.name}</Text>
                <Text style={styles.polygonMeta}>
                  {polygon.points.length} points
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEditPolygon(polygon)}
              >
                <Ionicons name="pencil" size={16} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(polygon)}
              >
                <Ionicons name="trash" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  polygonCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  polygonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  polygonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  polygonDetails: {
    flex: 1,
  },
  polygonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  polygonMeta: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
});

export default PolygonList;