import React, { useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Stack, router, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  Smartphone,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import {
  sendWhatsAppOTP,
  verifyWhatsAppOTP,
  isValidIndianPhoneNumber,
  formatPhoneNumber,
} from "@/services/whatsappOTP";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const { login, continueAsGuest } = useAuth();
  const params = useLocalSearchParams();
  const role = (params.role as UserRole) || "customer";
  const isGuest = params.guest === "true";
  const routerInstance = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  React.useEffect(() => {
    // Check if we can go back by checking if there's a previous route
    setCanGoBack(routerInstance.canGoBack());
  }, []);

  const handleSendOTP = async () => {
    if (!isValidIndianPhoneNumber(phone)) {
      Alert.alert(
        "Invalid Number",
        "Please enter a valid 10-digit Indian mobile number"
      );
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const result = await sendWhatsAppOTP(formattedPhone);

      if (result.success) {
        setStep("otp");
        Alert.alert(
          "✅ OTP Sent!",
          `A 6-digit verification code has been sent to your WhatsApp number ending in ${phone.slice(
            -4
          )}.`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to send OTP. Please try again."
        );
      }
    } catch (error: any) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error("Send OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const result = await verifyWhatsAppOTP(formattedPhone, otp);

      if (result.success && result.verified) {
        // OTP verified successfully, proceed with login
        const loginResult = await login(phone, otp, role);

        if (loginResult.success && loginResult.user) {
          // Check if user needs to complete basic info
          const needsBasicInfo =
            !loginResult.user.name ||
            loginResult.user.name.trim() === "" ||
            loginResult.user.addresses.length === 0;

          if (needsBasicInfo && loginResult.user.role === "customer") {
            router.replace("/auth/basic-info");
          } else {
            // Navigate based on user role
            router.replace("/(tabs)");
          }
        } else {
          Alert.alert(
            "Login Error",
            loginResult.error || "Failed to complete login. Please try again."
          );
        }
      } else {
        Alert.alert(
          "Invalid OTP",
          result.error || "The OTP you entered is incorrect. Please try again."
        );
        setOtp(""); // Clear OTP input
      }
    } catch (error: any) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error("Verify OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    await continueAsGuest();
    router.replace("/(tabs)");
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
          title: step === "phone" ? "Sign In" : "Verify OTP",
          headerLeft: canGoBack
            ? () => (
                <TouchableOpacity onPress={() => router.back()}>
                  <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>
              )
            : undefined,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.form}>
          <View style={styles.iconContainer}>
            <MessageCircle size={48} color="#48479B" />
          </View>

          <Text style={styles.title}>
            {step === "phone"
              ? `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`
              : "Enter OTP"}
          </Text>

          <Text style={styles.subtitle}>
            {step === "phone"
              ? "We&apos;ll send you a verification code via WhatsApp"
              : `We've sent a 4-digit code to +91 ${phone}`}
          </Text>

          {step === "phone" ? (
            <View style={styles.phoneContainer}>
              <View style={styles.countryCodeContainer}>
                <Smartphone
                  size={20}
                  color="#48479B"
                  style={styles.phoneIcon}
                />
                <Text style={styles.countryCode}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
              />
            </View>
          ) : (
            <>
              <View style={styles.otpContainer}>
                <TextInput
                  style={styles.otpInput}
                  placeholder="● ● ● ● ● ●"
                  placeholderTextColor="#DDD"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  editable={!loading}
                  autoFocus
                />
              </View>
              <View style={styles.otpHintContainer}>
                <CheckCircle size={16} color="#48479B" />
                <Text style={styles.otpHint}>
                  Check your WhatsApp for the code
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={step === "phone" ? handleSendOTP : handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.buttonText}> Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>
                {step === "phone" ? "Send OTP via WhatsApp" : "Verify & Login"}
              </Text>
            )}
          </TouchableOpacity>

          {step === "otp" && (
            <TouchableOpacity
              onPress={() => {
                setStep("phone");
                setOtp("");
              }}
              disabled={loading}
              style={styles.changeNumberButton}
            >
              <Text style={styles.linkText}>← Change phone number</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: "#FAFAFA",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: "center",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(72, 71, 155, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(72, 71, 155, 0.2)",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "white",
    marginBottom: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  countryCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 18,
    borderRightWidth: 2,
    borderRightColor: "#E5E7EB",
  },
  phoneIcon: {
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#48479B",
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    color: "#1F2937",
    fontWeight: "500",
  },
  otpContainer: {
    width: "100%",
    marginBottom: 16,
  },
  otpInput: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "white",
    paddingVertical: 20,
    width: "100%",
    color: "#48479B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  otpHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    gap: 8,
  },
  otpHint: {
    fontSize: 14,
    color: "#48479B",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#48479B",
    paddingVertical: 18,
    borderRadius: 12,
    width: "100%",
    marginBottom: 16,
    shadowColor: "#48479B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  changeNumberButton: {
    paddingVertical: 12,
  },
  linkText: {
    color: "#48479B",
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  guestText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
