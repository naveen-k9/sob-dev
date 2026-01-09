import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from 'expo-router';
import { ArrowLeft, Save, MapPin } from 'lucide-react-native';
// TODO: Uncomment when native maps are available
// import MapView, { Polygon, Marker } from 'react-native-maps';
import db from '@/db';

interface PolygonPoint {
  latitude: number;
  longitude: number;
}

export default function LocationPolygonScreen() {
  const [polygonPoints, setPolygonPoints] = useState<PolygonPoint[]>([]);
  const [locationName, setLocationName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('29');
  // TODO: Uncomment when native maps are available
  // const mapRef = useRef<MapView>(null);
  // const initialRegion = {
  //   latitude: 12.9716,
  //   longitude: 77.5946,
  //   latitudeDelta: 0.0922,
  //   longitudeDelta: 0.0421,
  // };

  // Temporary function to add demo points for testing
  const addDemoPoint = () => {
    if (polygonPoints.length < 4) {
      const demoPoints = [
        { latitude: 12.9716, longitude: 77.5946 },
        { latitude: 12.9726, longitude: 77.5956 },
        { latitude: 12.9706, longitude: 77.5966 },
        { latitude: 12.9696, longitude: 77.5936 },
      ];
      setPolygonPoints([...polygonPoints, demoPoints[polygonPoints.length]]);
    } else {
      Alert.alert('Maximum Points', 'You can only select 4 points for the polygon.');
    }
  };

  const clearPolygon = () => {
    setPolygonPoints([]);
  };

  const saveLocation = async () => {
    if (!locationName.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }

    if (polygonPoints.length < 3) {
      Alert.alert('Error', 'Please select at least 3 points to create a polygon');
      return;
    }

    try {
      await db.addLocationWithPolygon({
        name: locationName,
        address: `${locationName} Area`,
        polygon: polygonPoints,
        deliveryFee: parseFloat(deliveryFee) || 29,
      });

      Alert.alert(
        'Success',
        'Location with polygon area saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Select Delivery Area',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Create Delivery Zone</Text>
          <Text style={styles.instructionsText}>
            Tap on the map to select 4 points that define your delivery area. The polygon will be created automatically.
          </Text>
          <Text style={styles.pointsCounter}>
            Points selected: {polygonPoints.length}/4
          </Text>
        </View>

        {/* Map - TODO: Implement when native maps are available */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <MapPin size={48} color="#48479B" />
            <Text style={styles.mapPlaceholderTitle}>Map View Coming Soon</Text>
            <Text style={styles.mapPlaceholderText}>
              Native maps functionality will be available when react-native-maps is integrated.
            </Text>
            <Text style={styles.mapPlaceholderText}>
              Points selected: {polygonPoints.length}/4
            </Text>
            {polygonPoints.length > 0 && (
              <View style={styles.pointsList}>
                {polygonPoints.map((point, index) => (
                  <Text key={index} style={styles.pointText}>
                    Point {index + 1}: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location Name</Text>
            <TextInput
              style={styles.input}
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Enter location name (e.g., Koramangala)"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Delivery Fee (₹)</Text>
            <TextInput
              style={styles.input}
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              placeholder="29"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={addDemoPoint}
            >
              <MapPin size={16} color="#48479B" />
              <Text style={styles.demoButtonText}>Add Demo Point</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearPolygon}
            >
              <Text style={styles.clearButtonText}>Clear Points</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { opacity: polygonPoints.length >= 3 && locationName.trim() ? 1 : 0.5 }
              ]}
              onPress={saveLocation}
              disabled={polygonPoints.length < 3 || !locationName.trim()}
            >
              <Save size={16} color="white" />
              <Text style={styles.saveButtonText}>Save Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  pointsCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48479B',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F9FAFB',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    height: 48,
    backgroundColor: '#48479B',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  pointsList: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pointText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  demoButton: {
    flex: 1,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#48479B',
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48479B',
  },
});