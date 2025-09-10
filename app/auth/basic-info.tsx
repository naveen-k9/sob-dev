import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, User, Mail, MapPin, Home, Briefcase, Plus } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Address } from '@/types';

interface BasicInfoForm {
  name: string;
  email: string;
  addresses: Partial<Address>[];
}

export default function BasicInfoScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BasicInfoForm>({
    name: user?.name || '',
    email: user?.email || '',
    addresses: user?.addresses?.length ? user.addresses : [{
      type: 'home',
      label: 'Home',
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: true,
    }],
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const validAddresses = formData.addresses.filter(addr => 
        addr.street && addr.city && addr.state && addr.pincode
      ).map((addr, index) => ({
        ...addr,
        id: addr.id || `addr_${Date.now()}_${index}`,
        userId: user?.id || '',
        coordinates: addr.coordinates || { latitude: 0, longitude: 0 },
        deliveryInstructions: addr.deliveryInstructions || '',
      })) as Address[];

      await updateUser({
        name: formData.name,
        email: formData.email,
        addresses: validAddresses,
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup',
      'You can complete your profile later from the settings page.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => router.replace('/(tabs)') }
      ]
    );
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const updateAddress = (index: number, field: keyof Address, value: string) => {
    const updatedAddresses = [...formData.addresses];
    updatedAddresses[index] = {
      ...updatedAddresses[index],
      [field]: value,
    };
    setFormData({ ...formData, addresses: updatedAddresses });
  };

  const addNewAddress = () => {
    const newAddress: Partial<Address> = {
      type: 'other',
      label: 'Address ' + (formData.addresses.length + 1),
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: false,
    };
    setFormData({
      ...formData,
      addresses: [...formData.addresses, newAddress],
    });
  };

  const removeAddress = (index: number) => {
    if (formData.addresses.length > 1) {
      const updatedAddresses = formData.addresses.filter((_, i) => i !== index);
      setFormData({ ...formData, addresses: updatedAddresses });
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home size={20} color="#FF6B35" />;
      case 'work': return <Briefcase size={20} color="#FF6B35" />;
      default: return <MapPin size={20} color="#FF6B35" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Complete Your Profile',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.iconContainer}>
              <User size={48} color="#FF6B35" />
            </View>

            <Text style={styles.title}>Let&apos;s get to know you better</Text>
            <Text style={styles.subtitle}>
              Help us personalize your experience by completing your profile
            </Text>

            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Addresses Section */}
            <View style={styles.addressSection}>
              <View style={styles.addressHeader}>
                <Text style={styles.sectionTitle}>Delivery Addresses</Text>
                <TouchableOpacity onPress={addNewAddress} style={styles.addButton}>
                  <Plus size={16} color="#FF6B35" />
                  <Text style={styles.addButtonText}>Add Address</Text>
                </TouchableOpacity>
              </View>

              {formData.addresses.map((address, index) => (
                <View key={index} style={styles.addressCard}>
                  <View style={styles.addressCardHeader}>
                    {getAddressIcon(address.type || 'other')}
                    <TextInput
                      style={styles.addressLabel}
                      placeholder="Address label"
                      value={address.label}
                      onChangeText={(text) => updateAddress(index, 'label', text)}
                    />
                    {formData.addresses.length > 1 && (
                      <TouchableOpacity 
                        onPress={() => removeAddress(index)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TextInput
                    style={styles.addressInput}
                    placeholder="Street address"
                    value={address.street}
                    onChangeText={(text) => updateAddress(index, 'street', text)}
                    multiline
                  />

                  <View style={styles.addressRow}>
                    <TextInput
                      style={[styles.addressInput, styles.halfWidth]}
                      placeholder="City"
                      value={address.city}
                      onChangeText={(text) => updateAddress(index, 'city', text)}
                    />
                    <TextInput
                      style={[styles.addressInput, styles.halfWidth]}
                      placeholder="State"
                      value={address.state}
                      onChangeText={(text) => updateAddress(index, 'state', text)}
                    />
                  </View>

                  <View style={styles.addressRow}>
                    <TextInput
                      style={[styles.addressInput, styles.halfWidth]}
                      placeholder="Pincode"
                      value={address.pincode}
                      onChangeText={(text) => updateAddress(index, 'pincode', text)}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <TextInput
                      style={[styles.addressInput, styles.halfWidth]}
                      placeholder="Landmark (optional)"
                      value={address.landmark}
                      onChangeText={(text) => updateAddress(index, 'landmark', text)}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Saving...' : 'Save & Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSkip}
          >
            <Text style={styles.secondaryButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  form: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addressSection: {
    marginTop: 20,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  addButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '500',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});