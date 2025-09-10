import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import {
  X,
  Plus,
  MapPin,
  Home,
  Briefcase,
  Edit,
  Trash2,
  Check,
} from 'lucide-react-native';
import { Address } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface AddressBookModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress?: (address: Address) => void;
  showSelectMode?: boolean;
}

interface AddressFormData {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  type: 'home' | 'work' | 'other';
  label: string;
}

const initialFormData: AddressFormData = {
  name: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  type: 'home',
  label: 'Home',
};

export default function AddressBookModal({
  visible,
  onClose,
  onSelectAddress,
  showSelectMode = false,
}: AddressBookModalProps) {
  const { user, updateUserAddresses } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
    }
  }, [user?.addresses]);

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return Home;
      case 'work':
        return Briefcase;
      default:
        return MapPin;
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData(initialFormData);
    setShowAddForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      phone: address.phone,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      type: address.type,
      label: address.label,
    });
    setShowAddForm(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
            setAddresses(updatedAddresses);
            updateUserAddresses?.(updatedAddresses);
          },
        },
      ]
    );
  };

  const handleSaveAddress = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.addressLine.trim() ||
        !formData.city.trim() || !formData.state.trim() || !formData.pincode.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (formData.pincode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);

    try {
      const newAddress: Address = {
        id: editingAddress?.id || `addr_${Date.now()}`,
        userId: user?.id || '',
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        addressLine: formData.addressLine.trim(),
        street: formData.addressLine.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        type: formData.type,
        label: formData.label,
        coordinates: {
          latitude: 0,
          longitude: 0,
        },
        isDefault: addresses.length === 0,
      };

      let updatedAddresses: Address[];
      if (editingAddress) {
        updatedAddresses = addresses.map(addr =>
          addr.id === editingAddress.id ? newAddress : addr
        );
      } else {
        updatedAddresses = [...addresses, newAddress];
      }

      setAddresses(updatedAddresses);
      updateUserAddresses?.(updatedAddresses);
      setShowAddForm(false);
      setFormData(initialFormData);
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address: Address) => {
    if (onSelectAddress) {
      onSelectAddress(address);
      onClose();
    }
  };

  const renderAddressItem = ({ item }: { item: Address }) => {
    const IconComponent = getAddressIcon(item.type);
    
    return (
      <TouchableOpacity
        style={styles.addressItem}
        onPress={() => showSelectMode ? handleSelectAddress(item) : undefined}
        testID={`address-item-${item.id}`}
      >
        <View style={styles.addressIcon}>
          <IconComponent size={20} color="#FF6B35" />
        </View>
        <View style={styles.addressContent}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressLabel}>{item.label}</Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.addressName}>{item.name}</Text>
          <Text style={styles.addressPhone}>{item.phone}</Text>
          <Text style={styles.addressText}>
            {item.addressLine}, {item.city}, {item.state} - {item.pincode}
          </Text>
        </View>
        {!showSelectMode && (
          <View style={styles.addressActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditAddress(item)}
              testID={`edit-address-${item.id}`}
            >
              <Edit size={16} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteAddress(item.id)}
              testID={`delete-address-${item.id}`}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
        {showSelectMode && (
          <View style={styles.selectIndicator}>
            <Check size={20} color="#FF6B35" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAddressForm = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setShowAddForm(false);
            setFormData(initialFormData);
            setEditingAddress(null);
          }}
          style={styles.closeFormButton}
        >
          <X size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.formFields}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Name *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter full name"
            testID="address-name-input"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Phone Number *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Enter 10-digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
            testID="address-phone-input"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Address Line *</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={formData.addressLine}
            onChangeText={(text) => setFormData({ ...formData, addressLine: text })}
            placeholder="House/Flat no., Building, Street, Area"
            multiline
            numberOfLines={3}
            testID="address-line-input"
          />
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, styles.halfField]}>
            <Text style={styles.fieldLabel}>City *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="City"
              testID="address-city-input"
            />
          </View>

          <View style={[styles.fieldGroup, styles.halfField]}>
            <Text style={styles.fieldLabel}>State *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
              placeholder="State"
              testID="address-state-input"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Pincode *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.pincode}
            onChangeText={(text) => setFormData({ ...formData, pincode: text })}
            placeholder="6-digit pincode"
            keyboardType="numeric"
            maxLength={6}
            testID="address-pincode-input"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Address Type</Text>
          <View style={styles.typeSelector}>
            {[{ key: 'home', label: 'Home', icon: Home }, 
              { key: 'work', label: 'Work', icon: Briefcase }, 
              { key: 'other', label: 'Other', icon: MapPin }].map((type) => {
              const IconComponent = type.icon;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeOption,
                    formData.type === type.key && styles.selectedTypeOption,
                  ]}
                  onPress={() => {
                    setFormData({ 
                      ...formData, 
                      type: type.key as 'home' | 'work' | 'other',
                      label: type.label 
                    });
                  }}
                  testID={`address-type-${type.key}`}
                >
                  <IconComponent 
                    size={20} 
                    color={formData.type === type.key ? '#FF6B35' : '#666'} 
                  />
                  <Text style={[
                    styles.typeOptionText,
                    formData.type === type.key && styles.selectedTypeOptionText,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabledButton]}
        onPress={handleSaveAddress}
        disabled={loading}
        testID="save-address-button"
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {!showAddForm ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>
                {showSelectMode ? 'Select Address' : 'Address Book'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {addresses.length > 0 ? (
                <FlatList
                  data={addresses}
                  renderItem={renderAddressItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              ) : (
                <View style={styles.emptyState}>
                  <MapPin size={48} color="#DDD" />
                  <Text style={styles.emptyTitle}>No Addresses Added</Text>
                  <Text style={styles.emptyDescription}>
                    Add your first address to get started with deliveries
                  </Text>
                </View>
              )}
            </ScrollView>

            {!showSelectMode && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddAddress}
                testID="add-address-button"
              >
                <Plus size={20} color="white" />
                <Text style={styles.addButtonText}>Add New Address</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          renderAddressForm()
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addressItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  addressName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  selectIndicator: {
    padding: 8,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formContainer: {
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeFormButton: {
    padding: 4,
  },
  formFields: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedTypeOption: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF0EB',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  selectedTypeOptionText: {
    color: '#FF6B35',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});