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
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Weight,
  Target,
  Heart,
  MessageSquare,
  Send,
  ArrowLeft,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

type ContactMethod = 'phone' | 'email' | 'whatsapp';
type MealPreference = 'vegetarian' | 'non-vegetarian' | 'vegan' | 'jain';
type HealthGoal = 'weight-loss' | 'weight-gain' | 'muscle-building' | 'diabetes-management' | 'heart-health' | 'general-wellness';

export default function NutritionistContactScreen() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: '',
    weight: '',
    height: '',
    email: user?.email || '',
    phone: user?.phone || '',
    mealPreference: '' as MealPreference | '',
    healthGoals: [] as HealthGoal[],
    contactMethod: '' as ContactMethod | '',
    medicalConditions: '',
    currentDiet: '',
    additionalNotes: '',
  });
  const [loading, setLoading] = useState(false);

  const mealPreferences = [
    { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
    { id: 'non-vegetarian', label: 'Non-Vegetarian', icon: '🍗' },
    { id: 'vegan', label: 'Vegan', icon: '🌱' },
    { id: 'jain', label: 'Jain', icon: '🙏' },
  ];

  const healthGoals = [
    { id: 'weight-loss', label: 'Weight Loss', icon: '⚖️' },
    { id: 'weight-gain', label: 'Weight Gain', icon: '💪' },
    { id: 'muscle-building', label: 'Muscle Building', icon: '🏋️' },
    { id: 'diabetes-management', label: 'Diabetes Management', icon: '🩺' },
    { id: 'heart-health', label: 'Heart Health', icon: '❤️' },
    { id: 'general-wellness', label: 'General Wellness', icon: '✨' },
  ];

  const contactMethods = [
    { id: 'phone', label: 'Phone Call', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  ];

  const handleHealthGoalToggle = (goalId: HealthGoal) => {
    setFormData(prev => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(goalId)
        ? prev.healthGoals.filter(g => g !== goalId)
        : [...prev.healthGoals, goalId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.age || !formData.weight || !formData.contactMethod) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.healthGoals.length === 0) {
      Alert.alert('Error', 'Please select at least one health goal');
      return;
    }

    setLoading(true);
    try {
      // Here you would typically send the data to your backend
      console.log('Nutritionist contact form submitted:', formData);
      
      Alert.alert(
        'Request Submitted!',
        'Your nutritionist consultation request has been submitted successfully. Our team will contact you within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Nutritionist Consultation',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#48479B" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Heart size={32} color="#48479B" />
          </View>
          <Text style={styles.headerTitle}>Get Personalized Nutrition Guidance</Text>
          <Text style={styles.headerSubtitle}>
            Connect with our certified nutritionists for customized meal plans and health advice
          </Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Age *</Text>
              <View style={styles.inputContainer}>
                <Calendar size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.age}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))}
                  placeholder="Age"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Weight (kg) *</Text>
              <View style={styles.inputContainer}>
                <Weight size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.weight}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text }))}
                  placeholder="Weight"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height (cm)</Text>
            <View style={styles.inputContainer}>
              <Target size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.height}
                onChangeText={(text) => setFormData(prev => ({ ...prev, height: text }))}
                placeholder="Enter your height"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Meal Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Preference</Text>
          <View style={styles.optionsGrid}>
            {mealPreferences.map((preference) => (
              <TouchableOpacity
                key={preference.id}
                style={[
                  styles.optionCard,
                  formData.mealPreference === preference.id && styles.selectedOption,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, mealPreference: preference.id as MealPreference }))}
              >
                <Text style={styles.optionIcon}>{preference.icon}</Text>
                <Text style={[
                  styles.optionText,
                  formData.mealPreference === preference.id && styles.selectedOptionText,
                ]}>
                  {preference.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Goals *</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
          <View style={styles.optionsGrid}>
            {healthGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.optionCard,
                  formData.healthGoals.includes(goal.id as HealthGoal) && styles.selectedOption,
                ]}
                onPress={() => handleHealthGoalToggle(goal.id as HealthGoal)}
              >
                <Text style={styles.optionIcon}>{goal.icon}</Text>
                <Text style={[
                  styles.optionText,
                  formData.healthGoals.includes(goal.id as HealthGoal) && styles.selectedOptionText,
                ]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferred Contact Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Contact Method *</Text>
          <View style={styles.contactMethods}>
            {contactMethods.map((method) => {
              const IconComponent = method.icon;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.contactMethod,
                    formData.contactMethod === method.id && styles.selectedContactMethod,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, contactMethod: method.id as ContactMethod }))}
                >
                  <IconComponent 
                    size={24} 
                    color={formData.contactMethod === method.id ? '#48479B' : '#666'} 
                  />
                  <Text style={[
                    styles.contactMethodText,
                    formData.contactMethod === method.id && styles.selectedContactMethodText,
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medical Conditions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.medicalConditions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, medicalConditions: text }))}
              placeholder="Any medical conditions, allergies, or dietary restrictions"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Diet</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.currentDiet}
              onChangeText={(text) => setFormData(prev => ({ ...prev, currentDiet: text }))}
              placeholder="Describe your current eating habits and diet"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.additionalNotes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, additionalNotes: text }))}
              placeholder="Any specific questions or requirements for the nutritionist"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Send size={20} color="white" style={styles.submitIcon} />
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(163, 211, 151, 0.27)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: 'rgba(163, 211, 151, 0.27)',
    borderColor: '#48479B',
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#48479B',
    fontWeight: '600',
  },
  contactMethods: {
    gap: 12,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
  },
  selectedContactMethod: {
    backgroundColor: 'rgba(163, 211, 151, 0.27)',
    borderColor: '#48479B',
  },
  contactMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginLeft: 12,
  },
  selectedContactMethodText: {
    color: '#48479B',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#48479B',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});