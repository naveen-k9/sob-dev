import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Mail, Lock, ArrowLeft, UserPlus } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function EmailLoginScreen() {
  const { emailSignIn, emailSignUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (!email || !password) return false;
    if (mode === "signup" && !name.trim()) return false;
    return true;
  }, [email, password, mode, name]);

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      if (mode === "signin") {
        const res = await emailSignIn(email.trim().toLowerCase(), password);
        if (!res.success) {
          Alert.alert("Sign in failed", res.error ?? "Please try again.");
          return;
        }
        const u = res.user;
        if (!u?.name || (u.addresses?.length ?? 0) === 0) {
          router.replace("/auth/basic-info");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        const res = await emailSignUp({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
        });
        if (!res.success) {
          Alert.alert("Sign up failed", res.error ?? "Please try again.");
          return;
        }
        const u = res.user;
        if (!u?.name || (u.addresses?.length ?? 0) === 0) {
          router.replace("/auth/basic-info");
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (e: any) {
      console.log("[email-login] submit error", e);
      Alert.alert("Error", e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, name, canSubmit, emailSignIn, emailSignUp]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: mode === "signin" ? "Sign in" : "Create account",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.form}>
          <Text style={styles.title}>
            {mode === "signin" ? "Welcome back" : "Join us"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "signin"
              ? "Sign in with your email and password"
              : "Create your account with email and password"}
          </Text>

          {mode === "signup" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full name</Text>
              <View style={styles.inputRow}>
                <UserPlus size={18} color="#6B7280" />
                <TextInput
                  testID="nameInput"
                  style={styles.input}
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Mail size={18} color="#6B7280" />
              <TextInput
                testID="emailInput"
                style={styles.input}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color="#6B7280" />
              <TextInput
                testID="passwordInput"
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            testID="submitButton"
            style={[
              styles.button,
              !canSubmit || loading ? styles.buttonDisabled : null,
            ]}
            disabled={!canSubmit || loading}
            onPress={onSubmit}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Please wait…"
                : mode === "signin"
                ? "Sign in"
                : "Create account"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="toggleModeButton"
            onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            <Text style={styles.linkText}>
              {mode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { flex: 1 },
  form: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#111827",
  },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  linkText: {
    textAlign: "center",
    color: "#111827",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
});
