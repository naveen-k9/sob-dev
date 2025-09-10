import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Building2,
  Send,
  CheckCircle,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface CateringRequest {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  numberOfEmployees: string;
  mealType: string;
  frequency: string;
  startDate: string;
  specialRequirements: string;
}

export default function CorporateCateringScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<CateringRequest>({
    companyName: '',
    contactPerson: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    numberOfEmployees: '',
    mealType: '',
    frequency: '',
    startDate: '',
    specialRequirements: '',
  });

  const mealTypes = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snacks',
    'All Meals',
    'Custom Package'
  ];

  const frequencies = [
    'Daily',
    'Weekly (5 days)',
    'Bi-weekly',
    'Monthly',
    'Event-based',
    'Custom Schedule'
  ];

  const handleInputChange = (field: keyof CateringRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof CateringRequest)[] = [
      'companyName',
      'contactPerson',
      'email',
      'phone',
      'numberOfEmployees',
      'mealType',
      'frequency',
      'startDate'
    ];

    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        Alert.alert('Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Corporate Catering Request Submitted:', formData);
      
      setSubmitted(true);
      
      Alert.alert(
        'Request Submitted!',
        'Thank you for your corporate catering request. Our team will contact you within 24 hours with a customized quotation.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting catering request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMealTypeSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Meal Type *</Text>
      <View style={styles.optionsGrid}>
        {mealTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.optionChip,
              formData.mealType === type && styles.optionChipSelected
            ]}
            onPress={() => handleInputChange('mealType', type)}
          >
            <Text style={[
              styles.optionText,
              formData.mealType === type && styles.optionTextSelected
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFrequencySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Frequency *</Text>
      <View style={styles.optionsGrid}>
        {frequencies.map((freq) => (
          <TouchableOpacity
            key={freq}
            style={[
              styles.optionChip,
              formData.frequency === freq && styles.optionChipSelected
            ]}
            onPress={() => handleInputChange('frequency', freq)}
          >
            <Text style={[
              styles.optionText,
              formData.frequency === freq && styles.optionTextSelected
            ]}>
              {freq}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <CheckCircle size={80} color="#10B981" />
          <Text style={styles.successTitle}>Request Submitted!</Text>
          <Text style={styles.successMessage}>
            Thank you for your corporate catering request. Our team will review your requirements and contact you within 24 hours with a customized quotation.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Corporate Catering</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Building2 size={48} color="#FF6B35" />
            <Text style={styles.heroTitle}>Corporate Catering Services</Text>
            <Text style={styles.heroDescription}>
              Provide healthy, delicious meals for your team. Get a customized quotation based on your requirements.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Company Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Company Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Company Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.companyName}
                  onChangeText={(value) => handleInputChange('companyName', value)}
                  placeholder="Enter your company name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Person *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.contactPerson}
                  onChangeText={(value) => handleInputChange('contactPerson', value)}
                  placeholder="Enter contact person name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Enter email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  placeholder="Enter phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Catering Requirements */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Catering Requirements</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Number of Employees *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.numberOfEmployees}
                  onChangeText={(value) => handleInputChange('numberOfEmployees', value)}
                  placeholder="e.g., 50-100 employees"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {renderMealTypeSelector()}
              {renderFrequencySelector()}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preferred Start Date *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.startDate}
                  onChangeText={(value) => handleInputChange('startDate', value)}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Special Requirements</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.specialRequirements}
                  onChangeText={(value) => handleInputChange('specialRequirements', value)}
                  placeholder="Any dietary restrictions, preferences, or special requirements..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>Why Choose Our Corporate Catering?</Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={styles.benefitText}>Customized meal plans for your team</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={styles.benefitText}>Fresh, healthy, and nutritious meals</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={styles.benefitText}>Flexible scheduling and delivery</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={styles.benefitText}>Competitive pricing for bulk orders</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <>
                <Send size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </>
            )}
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
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: 'white',
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  optionChipSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  optionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: 'white',
  },
  benefitsSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#166534',
    flex: 1,
  },
  submitContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});