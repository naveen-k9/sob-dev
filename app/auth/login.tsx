import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Stack, router, useLocalSearchParams, useRouter } from "expo-router";
// import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import {
  sendWhatsAppOTP,
  verifyWhatsAppOTP,
  isValidIndianPhoneNumber,
  formatPhoneNumber,
} from "@/services/whatsappOTP";
import { Colors } from "@/constants/colors";
import { SvgXml } from "react-native-svg";
import Toast from "@/components/Toast";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpBoxes, setOtpBoxes] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    description?: string;
    type: "success" | "error" | "info" | "warning";
  }>({ visible: false, message: "", type: "info" });
  const { login, continueAsGuest } = useAuth();
  const params = useLocalSearchParams();
  const role = (params.role as UserRole) || "customer";
  const routerInstance = useRouter();
  const otpInputRefs = React.useRef<Array<TextInput | null>>([]);

  const handleSendOTP = async () => {
    if (!isValidIndianPhoneNumber(phone)) {
      setToast({
        visible: true,
        message: "Invalid Number",
        description: "Please enter a valid 10-digit Indian mobile number",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const result = await sendWhatsAppOTP(formattedPhone);

      if (result.success) {
        setStep("otp");
        setToast({
          visible: true,
          message: "OTP Sent!",
          description: `A 6-digit verification code has been sent to your WhatsApp number ending in ${phone.slice(
            -4
          )}.`,
          type: "success",
        });
      } else {
        setToast({
          visible: true,
          message: "Error",
          description: result.error || "Failed to send OTP. Please try again.",
          type: "error",
        });
      }
    } catch (error: any) {
      setToast({
        visible: true,
        message: "Error",
        description: "Something went wrong. Please try again.",
        type: "error",
      });
      console.error("Send OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste - extract only digits
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOtpBoxes = ["", "", "", "", "", ""];

      // Fill boxes with pasted digits
      digits.split("").forEach((char, i) => {
        if (i < 6) {
          newOtpBoxes[i] = char;
        }
      });

      setOtpBoxes(newOtpBoxes);
      setOtp(digits);

      // Focus the last filled box
      const lastFilledIndex = Math.min(digits.length - 1, 5);
      setTimeout(() => {
        otpInputRefs.current[lastFilledIndex]?.focus();
      }, 0);
      return;
    }

    if (/^[0-9]$/.test(value) || value === "") {
      const newOtpBoxes = [...otpBoxes];
      newOtpBoxes[index] = value;
      setOtpBoxes(newOtpBoxes);

      const newOtp = newOtpBoxes.join("");
      setOtp(newOtp);

      // Move to next input if value entered
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOTPKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otpBoxes[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setToast({
        visible: true,
        message: "Invalid OTP",
        description: "Please enter the complete 6-digit OTP",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const result = await verifyWhatsAppOTP(formattedPhone, otp);

      if (result.success && result.verified) {
        // OTP verified successfully, user is created/updated and token is returned
        console.log("OTP Verified! User data:", result.user);
        console.log("Auth token received:", result.token ? "Yes" : "No");
        console.log("Is new user:", result.isNewUser);

        // Sign in with the custom token
        if (result.token) {
          const loginResult = await login(
            phone,
            otp,
            (result.user?.role as UserRole) || "customer",
            result.token,
            result.user
          );

          console.log("Login result:", loginResult);

          if (loginResult.success && loginResult.user) {
            // Show basic-info screen only for new users
            if (result.isNewUser) {
              router.replace("/auth/basic-info");
            } else {
              // Navigate based on user role
              router.replace("/(tabs)");
            }
          } else {
            setToast({
              visible: true,
              message: "Login Error",
              description:
                loginResult.error ||
                "Failed to complete login. Please try again.",
              type: "error",
            });
          }
        } else {
          setToast({
            visible: true,
            message: "Authentication Error",
            description: "Failed to receive authentication token.",
            type: "error",
          });
        }
      } else {
        setToast({
          visible: true,
          message: "Invalid OTP",
          description:
            result.error ||
            "The OTP you entered is incorrect. Please try again.",
          type: "error",
        });
        setOtp(""); // Clear OTP input
        setOtpBoxes(["", "", "", "", "", ""]);
      }
    } catch (error: any) {
      setToast({
        visible: true,
        message: "Error",
        description: "Something went wrong. Please try again.",
        type: "error",
      });
      console.error("Verify OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    await continueAsGuest();
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    await continueAsGuest();
    router.replace("/(tabs)");
  };
  const logoXml = `
<svg xmlns="http://www.w3.org/2000/svg" fill="#ffffff" xmlns:xlink="http://www.w3.org/1999/xlink" id="Layer_1" x="0px" y="0px" viewBox="0 0 1200 867" style="enable-background:new 0 0 1200 867;" xml:space="preserve"><style type="text/css">	.st0{fill:#48479B;}</style><g>	<g>		<path class="st0" d="M195.7,205.6c0,36.6-20.9,59.3-73.1,59.3c-56.1,0-71.1-14.4-71.1-67.6h39.2c0,25.2,3,33.5,31.9,33.5   c26.6,0,32.2-9.2,32.2-25.8c0-11.4-1.7-18.1-25.6-33.5l-22.2-14.4C79.2,139,51.6,125.7,51.6,87.3c0-32.6,17.6-56.9,72.1-56.9   c56.5,0,69.7,13.8,69.7,63.6h-38.5c0-27.7-11.3-29.8-32.2-29.8c-23.6,0-30.9,8.6-30.9,23.4c0,10.4,3.3,17.5,33.9,36l25.2,15.4   c21.6,13.2,41.5,30.4,44.2,54.1C195.4,197.3,195.7,201.6,195.7,205.6z"></path>		<path class="st0" d="M373.8,259.8h-39.2L322.4,210c-0.7-2.7-2.3-4-4.9-4h-55.7c-2.3,0-4,1.5-4.6,3.7l-11.5,50.1h-37.9l45.5-183.1   c0.3-0.9,0.3-2.1,0.3-3.1c0-3.1-2.3-5.2-9.6-5.2h-24.4V36.7h101.2L373.8,259.8z M291.7,81.8c-0.3-0.9-1-1.5-1.6-1.5   c-0.7,0-1.3,0.6-1.6,1.5l-22.8,93.4c0,2.1,0.3,3.1,3.3,3.1h42.5c3,0,3-1.5,3-3.4L291.7,81.8z"></path>		<path class="st0" d="M542.2,259.8h-37.6v-77.5c0-2.4-1.3-3.7-2.6-3.7c-1,0-2.3,0.9-2.6,2.4l-24.1,78.7h-24.1l-25.4-77.8   c-0.7-2.4-2-3.7-3-3.7c-1.3,0-2.6,1.8-2.6,4.9v76.6h-37.6V36.4h37.6l38.9,127.9c1,3.7,3,5.5,4.9,5.5c1.6,0,3.6-1.8,4.6-5.5   l35.9-127.9h37.6V259.8z"></path>		<path class="st0" d="M675.4,259.5H557.5V33.5h117.9v32.8h-71.5c-4.3,0-8.4,4.3-8.4,8v60.3c0,3.7,3.3,7.7,7.7,7.7H662v35.2h-58.4   c-4.7,0-8,3.7-8,8.3v30.6c0,3.4,2,7.7,7.7,7.7h72.1V259.5z"></path>		<path class="st0" d="M788.2,263.6c-58.4,0-70.2-16.5-70.2-116.6c0-88.5,11.9-116.3,70.9-116.3c62,0,70.2,17.7,70.2,116.3   C859.1,250.2,847.5,263.6,788.2,263.6z M788.2,65.5c-23.7,0-32.6,3.7-32.6,81.5c0,75.4,8.6,81.5,32.6,81.5c24.7,0,33-5.2,33-81.5   C821.1,66.8,815.2,65.5,788.2,65.5z"></path>		<path class="st0" d="M1002.5,258.1h-124V35.3h40.2v181.6c0,6.1,4.6,10.1,11.9,10.1h71.9V258.1z"></path>		<path class="st0" d="M1088.7,258.1h-67.3V75c0-4.3-2.6-7.9-8.2-7.9h-21.1V35l96.6,0.3c41.2,0.3,70.6,15.3,70.6,112   C1159.3,232.5,1132.2,258.1,1088.7,258.1z M1078.8,67.4h-15.2c-3.3,0-4.9,1.8-4.9,4.6v149.2c0,3.1,1.6,4.3,4.3,4.3h15.8   c35.9,0,43.2-28.7,43.2-78.1C1122,91.5,1118.1,67.4,1078.8,67.4z"></path>		<path class="st0" d="M279.8,829.1H108.6V401.2c0-9.3-6.2-20.1-19.4-20.1H39.7v-75.3h226.9c121.6,0,165.8,24.4,165.8,155.5   c0,63.8-34.1,103.2-79,109.7v4.3c48.8,2.9,82.9,29.4,82.9,114C436.2,786.8,381.2,829.1,279.8,829.1z M243.4,381.1h-38.7   c-5.4,0-9.3,3.6-9.3,7.9v139.1c0,5,2.3,6.5,7.7,6.5h40.3c84.4,0,100.7-12.9,101.5-83.1C344.8,396.9,334.8,381.1,243.4,381.1z    M257.3,611.9h-53.4c-3.9,0-8.5,3.6-8.5,7.2v124c0,5,3.1,7.9,7.7,7.9h56.5c77.4,0,83.6-15.8,83.6-71.7   C343.3,627,322.4,611.9,257.3,611.9z"></path>		<path class="st0" d="M635.2,295.1c-138.6,0-166.5,65.2-166.5,273.1c0,235.1,27.9,273.8,165,273.8c139.4,0,166.5-31.5,166.5-273.8   C800.2,336.7,780.9,295.1,635.2,295.1z M572.2,443.4c-0.4-15.1,20.1-15.2,20-0.3c0.2,19.6,0.1,39.3,0,58.9c0,7.3-4,11.6-10.3,11.8   c-5.8,0.2-9.4-4-9.5-11.5c-0.1-9.9,0-19.9,0-29.8h-0.2C572.1,462.8,572,453.1,572.2,443.4z M632.4,518c-0.2,11-6.1,19.5-14.9,25.3   c-7.6,5-10.1,11.3-9.9,20c1.5,48,2.8,96,4,143.9c0.4,15.1-8.5,27-22.1,30.4c-20,5-37.7-10-37.1-31.7c0.6-24.2,3.7-120.2,4-143.9   c0.1-8-2.3-13.7-9.1-18.3c-10.6-7.1-16.2-17.3-16.2-30.4c0.2-23.1,0.2-46.2,0.3-69.3c-0.4-16.5,20.5-16.3,20.1,0.3   c0.2,22.4,0.4,44.8,0.3,67.2c0,7.2,2.4,12.4,8.4,16.6c11.4,8,16.6,19.1,16.2,33.2c-1.3,49.3-3.3,98.7-3.9,148c1,5.5,4,9.4,10,9   c5.9-0.3,9-4.1,9-9.9c-0.7-49.4-2.7-98.7-3.9-148c-0.3-13.1,4.5-23.8,15.4-31.5c6.8-4.7,9.9-10.6,9.6-19.4   c-0.6-22.4-0.1-44.8,0.1-67.2c0.1-6.4,4.3-10.6,10-10.5c5.4,0.1,9.7,3.9,9.7,10.1C632.8,467.4,632.8,492.7,632.4,518z    M736.3,523.8c-2.8,4.3-5.8,8.7-9.6,12.1c-4.8,4.4-6.3,9.4-6,15.7c1.3,25.7,3.5,128,4.3,153.3c1.1,44.4-60.4,45.2-60.2,0.7   c1.2-51.3,2.6-102.7,4.2-154c0.2-6.6-1.5-11.4-6.3-16.2c-24.5-24.4-25.4-69.6-2.2-95.3c19.8-21.8,49.2-21.8,69,0.1   C748.9,461.8,752,499,736.3,523.8z M672,457.6c-9,13.4-10.4,28.5-6.1,43.5c2,7.1,5.7,14.8,10.9,19.8c8.7,8.2,12.6,17.3,12.2,28.8   c-0.6,21.2-2.6,60-3.6,72.2c-0.3,3.7-0.5,7.5-0.5,11.2c0,23.1,0.1,46.2,0,69.3c0,10.7,3.2,16.1,10.1,16.1   c7,0.1,10.4-5.2,10.1-15.9c-1.4-51.1-2.7-102.3-4.2-153.4c-0.3-10.4,2.9-18.9,10.4-26.2c17-16.4,19.8-45.9,6.5-65.5   C705.5,439.2,684.2,439.2,672,457.6z"></path>		<path class="st0" d="M1160.3,829.1h-89.8l-72.8-155.5c-0.8-2.1-2.3-2.9-3.9-2.9s-3.1,0.7-3.9,2.9l-71.3,155.5h-90.6l117-253.7   c1.5-3.6,2.3-6.4,2.3-8.6c0-2.9-0.8-5-1.6-7.2L830.4,305.9h89.8l68.9,151.2c0.8,2.1,3.1,3.6,4.6,3.6s3.1-1.4,4.6-3.6l69.7-151.2   h90.6l-116.2,254.5c-0.8,2.1-1.5,4.3-1.5,6.4c0,2.9,0.8,5,2.3,7.2L1160.3,829.1z"></path>	</g></g></svg>
`;
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ffffff" />
      <Toast
        visible={toast.visible}
        message={toast.message}
        description={toast.description}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <View style={styles.scrollContent}>
            {/* Skip Button */}

            <TouchableOpacity
              style={styles.skipButton2}
              onPress={() => router.push("/auth/email-login")}
            >
              <Text style={styles.skipButtonText}>Email Login</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            {/* Logo Section */}
            <View style={styles.logoSection}>
              {/* Spiral Logo */}
              <View style={styles.logoContainer}>
                <SvgXml xml={logoXml} width={144} height={144} />
              </View>

              {/* Tagline */}
              <Text style={styles.tagline}>
                Say goodbye to long queues{"\n"}and uninspiring meals!
              </Text>
            </View>

            {/* White Bottom Section */}
            <View style={styles.bottomSection}>
              <Text style={styles.heading}>
                {step === "phone" ? "Log In or Sign Up" : "Verify OTP"}
              </Text>

              {step === "phone" ? (
                <>
                  {/* Phone Input Container */}
                  <View style={styles.inputContainer}>
                    <View style={styles.countryCodeBox}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Enter Phone Number"
                      placeholderTextColor="#9CA3AF"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={10}
                      editable={!loading}
                    />
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={[
                      styles.continueButton,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={handleSendOTP}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.continueButtonText}>Continue</Text>
                    )}
                  </TouchableOpacity>

                  {/* Terms Text */}
                  <View style={styles.termsContainer}>
                    <Text style={styles.termsText}>
                      By continuing, I accept the{" "}
                      <Text style={styles.termsLink}>Terms & Condition</Text>{" "}
                      and{"\n"}
                      <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {/* OTP Subtitle */}
                  <Text style={styles.otpSubtitle}>
                    Enter the 6-digit code sent to{"\n"}
                    +91 {phone}
                  </Text>

                  {/* OTP Input Boxes */}
                  <View style={styles.otpBoxesContainer}>
                    {otpBoxes.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          otpInputRefs.current[index] = ref;
                        }}
                        style={[styles.otpBox, digit && styles.otpBoxFilled]}
                        value={digit}
                        onChangeText={(value) => handleOTPChange(value, index)}
                        onKeyPress={(e) => handleOTPKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={6}
                        editable={!loading}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  {/* Verify Button */}
                  <TouchableOpacity
                    style={[
                      styles.continueButton,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.continueButtonText}>Verify</Text>
                    )}
                  </TouchableOpacity>

                  {/* Change Number Link */}
                  <TouchableOpacity
                    onPress={() => {
                      setStep("phone");
                      setOtp("");
                      setOtpBoxes(["", "", "", "", "", ""]);
                    }}
                    disabled={loading}
                    style={styles.changeNumberContainer}
                  >
                    <Text style={styles.changeNumberText}>
                      Change phone number
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  gradient: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    // paddingBottom: 20,
    backgroundColor: Colors.primary,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButton2: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: "600",
  },
  logoSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // paddingTop: 60,
    // paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  spiralWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  spiralDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#F3E8A8",
    position: "absolute",
    top: 10,
    zIndex: 4,
  },
  spiralRing1: {
    width: 80,
    height: 40,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: "#F3E8A8",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    position: "absolute",
    top: 20,
    transform: [{ rotate: "20deg" }],
  },
  spiralRing2: {
    width: 100,
    height: 50,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: "#F3E8A8",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    position: "absolute",
    top: 35,
  },
  spiralRing3: {
    width: 60,
    height: 30,
    borderRadius: 30,
    borderWidth: 8,
    borderColor: "#F3E8A8",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    position: "absolute",
    bottom: 20,
    transform: [{ rotate: "-10deg" }],
  },
  tagline: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 27,
  },
  bottomSection: {
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 27,
    paddingBottom: 27,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  countryCodeBox: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 8,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 8,
    fontSize: 16,
    color: "#1F2937",
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  termsContainer: {
    alignItems: "center",
  },
  termsText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.accent,
    fontWeight: "600",
  },
  otpSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  otpBoxesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#1F2937",
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: "#F9FAFB",
  },
  changeNumberContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  changeNumberText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});
