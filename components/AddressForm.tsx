import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface AddressFormProps {
  onSubmit: (address: {
    name: string;
    phoneNumber: string;
    addressText: string;
    coordinates: { latitude: number; longitude: number };
  }) => void;
  onCancel: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressText, setAddressText] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to use current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCoordinates({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Reverse geocode to get address
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const formattedAddress = [
            address.streetNumber,
            address.street,
            address.city,
            address.region,
            address.postalCode,
          ].filter(Boolean).join(', ');
          
          if (formattedAddress) {
            setAddressText(formattedAddress);
          }
        }
      } catch (error) {
        console.log('Reverse geocoding failed:', error);
      }

      Alert.alert('Success', 'Current location captured!');
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number.');
      return;
    }

    if (!addressText.trim()) {
      Alert.alert('Error', 'Please enter an address.');
      return;
    }

    if (!coordinates) {
      Alert.alert('Error', 'Please capture the current location or set coordinates.');
      return;
    }

    onSubmit({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      addressText: addressText.trim(),
      coordinates,
    });

    // Reset form
    setName('');
    setPhoneNumber('');
    setAddressText('');
    setCoordinates(null);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Address</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              placeholderTextColor="#C7C7CC"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={addressText}
              onChangeText={setAddressText}
              placeholder="Enter address"
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.locationButton, coordinates && styles.locationButtonActive]}
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            <Ionicons 
              name={coordinates ? "location" : "location-outline"} 
              size={20} 
              color={coordinates ? "#FFFFFF" : "#007AFF"} 
            />
            <Text style={[
              styles.locationButtonText, 
              coordinates && styles.locationButtonTextActive
            ]}>
              {isLoadingLocation 
                ? 'Getting Location...' 
                : coordinates 
                ? 'Location Captured' 
                : 'Use Current Location'
              }
            </Text>
          </TouchableOpacity>

          {coordinates && (
            <View style={styles.coordinatesDisplay}>
              <Text style={styles.coordinatesText}>
                📍 {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Save Address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginBottom: 16,
  },
  locationButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  locationButtonTextActive: {
    color: '#FFFFFF',
  },
  coordinatesDisplay: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#34C759',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AddressForm;