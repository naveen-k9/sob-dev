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
} from 'react-native';
import { Stack, router, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const { login, continueAsGuest } = useAuth();
  const params = useLocalSearchParams();
  const role = (params.role as UserRole) || 'customer';
  const isGuest = params.guest === 'true';
  const routerInstance = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  React.useEffect(() => {
    // Check if we can go back by checking if there's a previous route
    setCanGoBack(routerInstance.canGoBack());
  }, []);

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    // Simulate OTP sending
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      Alert.alert('OTP Sent', 'Please enter the OTP: 1234');
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    const result = await login(phone, otp, role);
    setLoading(false);

    if (result.success && result.user) {
      // Check if user needs to complete basic info
      const needsBasicInfo = !result.user.name || result.user.name.trim() === '' || 
                            result.user.addresses.length === 0;
      
      if (needsBasicInfo && result.user.role === 'customer') {
        router.replace('/auth/basic-info');
      } else {
        // Navigate based on user role
        switch (result.user.role) {
          case 'admin':
            router.replace('/(tabs)');
            break;
          case 'kitchen':
            router.replace('/(tabs)');
            break;
          case 'delivery':
            router.replace('/(tabs)');
            break;
          default:
            router.replace('/(tabs)');
        }
      }
    } else {
      Alert.alert('Error', result.error || 'Invalid OTP. Please try again.');
    }
  };

  const handleGuestMode = async () => {
    await continueAsGuest();
    router.replace('/(tabs)');
  };

  // Auto-continue as guest if guest param is true
  React.useEffect(() => {
    if (isGuest) {
      handleGuestMode();
    }
  }, [isGuest]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: step === 'phone' ? 'Sign In' : 'Verify OTP',
          headerLeft: canGoBack ? () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
          ) : undefined,
        }} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.form}>
          <View style={styles.iconContainer}>
            <MessageCircle size={48} color="#FF6B35" />
          </View>

          <Text style={styles.title}>
            {step === 'phone' ? `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}` : 'Enter OTP'}
          </Text>
          
          <Text style={styles.subtitle}>
            {step === 'phone' 
              ? 'We&apos;ll send you a verification code via WhatsApp'
              : `We've sent a 4-digit code to +91 ${phone}`
            }
          </Text>

          {step === 'phone' ? (
            <View style={styles.phoneContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          ) : (
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={4}
              textAlign="center"
            />
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={step === 'phone' ? handleSendOTP : handleVerifyOTP}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Please wait...' : (step === 'phone' ? 'Send OTP' : 'Verify OTP')}
            </Text>
          </TouchableOpacity>

          {step === 'otp' && (
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={styles.linkText}>Change phone number</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            testID="emailAuthButton"
            style={[styles.altButton]}
            onPress={() => router.push('/auth/email-login')}
          >
            <Text style={styles.altButtonText}>Sign in with Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleGuestMode}>
            <Text style={styles.guestText}>Continue as Guest</Text>
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
    justifyContent: 'space-between',
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
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
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 24,
    width: '100%',
  },
  countryCode: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#DDD',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingVertical: 16,
    marginBottom: 24,
    width: '100%',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  linkText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  altButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFFFFF',
  },
  altButtonText: {
    textAlign: 'center',
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  guestText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});