import React, { useState, useCallback } from "react";
import {
  
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Bell, Send, TestTube, RefreshCw, Trash2 } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import db from "@/db";
import { UserRole } from "@/types";
import {
  broadcastNotification,
  createNotification,
  listUsers,
  clearTestNotifications,
} from "@/test-notifications";

export default function TestNotificationsScreen() {
  const { user } = useAuth();
  const { items: notifications, reload: reloadNotifications } =
    useNotifications();
  const [title, setTitle] = useState<string>("🧪 Test Notification");
  const [message, setMessage] = useState<string>(
    "This is a test broadcast notification"
  );
  const [role, setRole] = useState<UserRole | "all">("all");
  const [sending, setSending] = useState<boolean>(false);
  const [testLog, setTestLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setTestLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  }, []);

  const handleBroadcastTest = useCallback(async () => {
    try {
      if (!user || user.role !== "admin") {
        Alert.alert("Unauthorized", "Only admin can send test notifications");
        return;
      }
      if (!title.trim() || !message.trim()) {
        Alert.alert("Validation", "Title and message are required");
        return;
      }

      setSending(true);
      setTestLog([]);
      addLog("🚀 Starting broadcast test...");

      const notificationData = {
        title,
        message,
        type: "promotion" as const,
        isRead: false,
        data: {
          via: "test_ui",
          testId: Date.now().toString(),
          timestamp: new Date().toISOString(),
        },
      };

      addLog(`📤 Broadcasting to role: ${role}`);
      const count = await broadcastNotification(notificationData, role);
      addLog(`✅ Successfully created ${count} notifications`);

      // Reload notifications context to see new ones
      addLog("🔄 Reloading notifications...");
      await reloadNotifications();

      addLog(`✅ Test completed! Check notifications screen.`);

      Alert.alert(
        "Test Successful! ✅",
        `Notification delivered to ${count} users.\n\nCheck the Notifications screen to see it!`,
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setTitle("🧪 Test Notification");
              setMessage("This is a test broadcast notification");
              setRole("all");
            },
          },
        ]
      );
    } catch (e) {
      console.error("Test notification error:", e);
      addLog(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
      Alert.alert("Error", "Failed to send test notification. Check logs.");
    } finally {
      setSending(false);
    }
  }, [title, message, role, user, addLog, reloadNotifications]);

  const handleSendToSelf = useCallback(async () => {
    try {
      if (!user) {
        Alert.alert("Error", "User not found");
        return;
      }

      setSending(true);
      setTestLog([]);
      addLog(`🎯 Sending test notification to yourself (${user.email})...`);

      const notificationData = {
        title: title || "🧪 Personal Test",
        message: message || "This is a test notification sent to you only",
        type: "promotion" as const,
        isRead: false,
        data: {
          via: "test_ui_personal",
          testId: Date.now().toString(),
          timestamp: new Date().toISOString(),
        },
      };

      await createNotification(user.id, notificationData);
      addLog("✅ Notification created for your account");

      // Reload notifications
      addLog("🔄 Reloading notifications...");
      await reloadNotifications();

      addLog("✅ Done! Check notifications screen.");

      Alert.alert(
        "Test Sent! ✅",
        "Notification sent to your account.\n\nCheck the Notifications screen!",
        [{ text: "OK" }]
      );
    } catch (e) {
      console.error("Send to self error:", e);
      addLog(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
      Alert.alert("Error", "Failed to send notification");
    } finally {
      setSending(false);
    }
  }, [user, title, message, addLog, reloadNotifications]);

  const handleClearTests = useCallback(async () => {
    try {
      Alert.alert(
        "Clear Test Notifications",
        "This will remove all test notifications. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear",
            style: "destructive",
            onPress: async () => {
              setSending(true);
              setTestLog([]);
              addLog("🧹 Clearing test notifications...");

              const count = await clearTestNotifications();
              addLog(`✅ Removed ${count} test notifications`);

              await reloadNotifications();
              addLog("🔄 Notifications reloaded");

              Alert.alert("Success", `Cleared ${count} test notifications`);
            },
          },
        ]
      );
    } catch (e) {
      console.error("Clear error:", e);
      addLog(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
      Alert.alert("Error", "Failed to clear test notifications");
    } finally {
      setSending(false);
    }
  }, [addLog, reloadNotifications]);

  const handleShowUsers = useCallback(async () => {
    try {
      setSending(true);
      setTestLog([]);
      addLog("📋 Fetching users...");

      const users = await db.getUsers();
      addLog(`\n👥 Total users: ${users.length}\n`);

      users.forEach((u, idx) => {
        addLog(`${idx + 1}. ${u.name} (${u.role})`);
        addLog(`   Email: ${u.email}`);
        addLog(`   Push Token: ${u.pushToken ? "✓" : "✗"}\n`);
      });
    } catch (e) {
      console.error("List users error:", e);
      addLog(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSending(false);
    }
  }, [addLog]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: "🧪 Test Notifications" }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <TestTube color="#8B5CF6" size={24} />
          <Text style={styles.infoTitle}>Notification Test Center</Text>
          <Text style={styles.infoText}>
            Test the notification system by sending broadcast or personal
            notifications. Notifications will appear in the Notifications screen
            and as alerts.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Your Notifications</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {notifications.filter((n) => !n.isRead).length}
            </Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Notification Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter notification title"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Enter message"
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Target Audience</Text>
          <View style={styles.rolesRow}>
            {(["all", "customer", "admin", "kitchen", "delivery"] as const).map(
              (r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r as any)}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                  disabled={sending}
                >
                  <Text
                    style={[
                      styles.roleText,
                      role === r && styles.roleTextActive,
                    ]}
                  >
                    {r.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              sending && styles.buttonDisabled,
            ]}
            onPress={handleBroadcastTest}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Send size={20} color="white" />
                <Text style={styles.buttonText}>Broadcast Test</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.secondaryButton,
              sending && styles.buttonDisabled,
            ]}
            onPress={handleSendToSelf}
            disabled={sending}
          >
            <Bell size={20} color="#8B5CF6" />
            <Text style={[styles.buttonText, { color: "#8B5CF6" }]}>
              Send to Me
            </Text>
          </TouchableOpacity>

          <View style={styles.utilityRow}>
            <TouchableOpacity
              style={[styles.utilityButton, sending && styles.buttonDisabled]}
              onPress={handleShowUsers}
              disabled={sending}
            >
              <RefreshCw size={18} color="#6B7280" />
              <Text style={styles.utilityText}>List Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.utilityButton, sending && styles.buttonDisabled]}
              onPress={handleClearTests}
              disabled={sending}
            >
              <Trash2 size={18} color="#EF4444" />
              <Text style={[styles.utilityText, { color: "#EF4444" }]}>
                Clear Tests
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Test Log */}
        {testLog.length > 0 && (
          <View style={styles.logCard}>
            <Text style={styles.logTitle}>📋 Test Log</Text>
            <ScrollView style={styles.logScroll} nestedScrollEnabled>
              {testLog.map((log, idx) => (
                <Text key={idx} style={styles.logText}>
                  {log}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    backgroundColor: "#F3E8FF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6B21A8",
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#7C3AED",
    textAlign: "center",
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  rolesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  roleChipActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  roleTextActive: {
    color: "white",
  },
  actionsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: "#8B5CF6",
  },
  secondaryButton: {
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  utilityRow: {
    flexDirection: "row",
    gap: 8,
  },
  utilityButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  utilityText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  logCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 12,
  },
  logScroll: {
    maxHeight: 250,
  },
  logText: {
    fontSize: 12,
    color: "#D1D5DB",
    fontFamily: "monospace",
    marginBottom: 4,
  },
});
