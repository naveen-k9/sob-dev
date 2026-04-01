import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from 'expo-router';
import { ArrowLeft, User, Mail, MapPin, Calendar } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

interface BasicInfoForm {
  name: string;
  email: string;
  dob?: string;
}

export default function BasicInfoScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BasicInfoForm>({
    name: user?.name || '',
    email: user?.email || '',
    dob: user?.dob ? (user.dob instanceof Date ? user.dob.toISOString().slice(0, 10) : String(user.dob)) : undefined,
  });

  const parseDateInput = (value: string): Date | null => {
    if (!value) return null;
    const v = value.trim();
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    const dmy1 = /^\d{2}\/\d{2}\/\d{4}$/;
    const dmy2 = /^\d{2}-\d{2}-\d{4}$/;
    try {
      if (iso.test(v)) {
        const dt = new Date(v + 'T00:00:00');
        return isNaN(dt.getTime()) ? null : dt;
      }
      if (dmy1.test(v) || dmy2.test(v)) {
        const parts = v.includes('/') ? v.split('/') : v.split('-');
        const dt = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return isNaN(dt.getTime()) ? null : dt;
      }
      const fallback = new Date(v);
      return isNaN(fallback.getTime()) ? null : fallback;
    } catch {
      return null;
    }
  };

  const isReasonableAge = (dob: Date) => {
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age >= 13 && age <= 120;
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (formData.dob) {
      const parsed = parseDateInput(formData.dob);
      if (!parsed || !isReasonableAge(parsed)) {
        Alert.alert('Error', 'Please enter a valid Date of Birth (YYYY-MM-DD). Age must be between 13 and 120 years.');
        return;
      }
    }

    setLoading(true);
    try {
      await updateUser({
        name: formData.name,
        email: formData.email,
        dob: formData.dob ? new Date(formData.dob) : undefined,
      });

      router.replace('/location/select');
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
        { text: 'Skip', onPress: () => router.replace('/(tabs)') },
      ]
    );
  };

  const safeBack = () => {
    // When this screen is opened via router.replace (common in onboarding),
    // there may be no back stack, so router.back() would dispatch GO_BACK with no handler.
    const canGoBack = typeof (router as any).canGoBack === "function" ? (router as any).canGoBack() : false;
    if (canGoBack) router.back();
    else router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Complete Your Profile',
          headerLeft: () => (
            <TouchableOpacity onPress={safeBack}>
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
              <User size={48} color={Colors.primary} />
            </View>

            <Text style={styles.title}>Let&apos;s get to know you better</Text>
            <Text style={styles.subtitle}>
              Help us personalize your experience by completing your profile
            </Text>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <View style={styles.inputContainer}>
                <Calendar size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.dob}
                  onChangeText={(text) => setFormData({ ...formData, dob: text })}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.addressHint}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.addressHintText}>
                You'll be able to add your delivery address on the next screen using the map
              </Text>
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
              {loading ? 'Saving...' : 'Save & Add Address'}
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
    backgroundColor: 'rgba(163, 211, 151, 0.27)',
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
  addressHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(72, 71, 155, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  addressHintText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
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
    backgroundColor: Colors.primary,
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
