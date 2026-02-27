/**
 * Admin: Notification & Subscription Testing Panel
 *
 * Allows admins to:
 * - Pick any user and view their push token
 * - Pick any active subscription and manually advance delivery status
 * - Manually change subscription lifecycle status
 * - Fire test push notifications and WhatsApp messages to any user
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Switch,
  Platform,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Users,
  RefreshCw,
  Copy,
  Play,
  Check,
  X,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Zap,
  Phone,
  Search,
} from "lucide-react-native";
import db from "@/db";
import { User, Subscription } from "@/types";
import { sendTestWhatsAppCallable } from "@/services/firebaseFunctions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DeliveryStatus =
  | "packaging"
  | "packaging_done"
  | "delivery_started"
  | "reached"
  | "delivery_done";

type SubscriptionStatus = "active" | "paused" | "cancelled" | "completed";

const DELIVERY_STEPS: Array<{ key: DeliveryStatus; label: string; icon: any; color: string }> = [
  { key: "packaging",       label: "Packaging",         icon: Package,      color: "#F59E0B" },
  { key: "packaging_done",  label: "Packaging Done",    icon: Package,      color: "#8B5CF6" },
  { key: "delivery_started",label: "Out for Delivery",  icon: Truck,        color: "#3B82F6" },
  { key: "reached",         label: "Reached",           icon: MapPin,       color: "#F97316" },
  { key: "delivery_done",   label: "Delivered",         icon: CheckCircle2, color: "#10B981" },
];

const SUB_STATUSES: Array<{ key: SubscriptionStatus; color: string }> = [
  { key: "active",    color: "#10B981" },
  { key: "paused",    color: "#F59E0B" },
  { key: "cancelled", color: "#EF4444" },
  { key: "completed", color: "#6B7280" },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TestNotificationsScreen() {
  const router = useRouter();

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  // UI state
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showSubPicker, setShowSubPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null); // which action is running

  // Test notification options
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendPush, setSendPush] = useState(true);

  // Results log
  const [log, setLog] = useState<Array<{ ts: string; msg: string; ok: boolean }>>([]);

  const addLog = (msg: string, ok = true) => {
    const ts = new Date().toLocaleTimeString("en-IN");
    setLog((prev) => [{ ts, msg, ok }, ...prev.slice(0, 29)]);
  };

  // ---------------------------------------------------------------------------
  // Load data
  // ---------------------------------------------------------------------------
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const [u, s] = await Promise.all([db.getUsers(), db.getSubscriptions()]);
      setUsers(u.filter((usr) => !usr.isGuest));
      setSubscriptions(s);
    } catch (e) {
      console.log("[TestNotif] load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Keep selectedSub in sync if user changes
  useEffect(() => {
    if (!selectedUser) { setSelectedSub(null); return; }
    if (selectedSub && selectedSub.userId !== selectedUser.id) setSelectedSub(null);
  }, [selectedUser, selectedSub]);

  // ---------------------------------------------------------------------------
  // User subscriptions helper
  // ---------------------------------------------------------------------------
  const userSubs = selectedUser
    ? subscriptions.filter((s) => s.userId === selectedUser.id)
    : [];

  // ---------------------------------------------------------------------------
  // Delivery status actions
  // ---------------------------------------------------------------------------
  const setDeliveryStatus = async (status: DeliveryStatus) => {
    if (!selectedSub) return Alert.alert("No subscription selected");
    const date = todayStr();
    setBusy(`delivery_${status}`);
    try {
      await db.updateSubscriptionDeliveryStatus(selectedSub.id, date, status, selectedUser?.id);
      addLog(`Delivery status → ${status}`, true);

      // Reload subscription to show updated state
      const updated = await db.getSubscriptionById(selectedSub.id);
      if (updated) setSelectedSub(updated);

      // Delivery pushes are sent by Firebase Functions when deliveryStatusByDate changes
      if (sendPush) addLog(`Delivery push will be sent by backend if assigned`, true);
    } catch (e: any) {
      addLog(`Error: ${e?.message || e}`, false);
    } finally {
      setBusy(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Subscription lifecycle status
  // ---------------------------------------------------------------------------
  const setSubStatus = async (status: SubscriptionStatus) => {
    if (!selectedSub) return Alert.alert("No subscription selected");
    setBusy(`sub_${status}`);
    try {
      await db.updateSubscription(selectedSub.id, { status });
      addLog(`Sub status → ${status}`, true);

      const updated = await db.getSubscriptionById(selectedSub.id);
      if (updated) setSelectedSub(updated);

      // Push is sent by Firebase Functions on subscription change; WhatsApp via callable for testing
      const user = selectedUser;
      if (user) {
        if (sendWhatsApp && user.phone) {
          await sendTestWhatsAppCallable({ phone: user.phone });
        }
        if (sendPush) addLog(`Push is sent by backend on subscription update`, true);
        if (sendWhatsApp) addLog(`WhatsApp test sent for status=${status}`, true);
      }
    } catch (e: any) {
      addLog(`Error: ${e?.message || e}`, false);
    } finally {
      setBusy(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Test: Send push to selected user
  // ---------------------------------------------------------------------------
  const sendTestPush = async () => {
    const user = selectedUser;
    if (!user) return Alert.alert("Select a user first");
    Alert.alert(
      "Push from backend",
      "All pushes are sent from Firebase Functions (Expo Push API). Trigger a real event (e.g. change delivery status to Out for delivery) to test."
    );
  };

  // ---------------------------------------------------------------------------
  // Test: Send WhatsApp to selected user
  // ---------------------------------------------------------------------------
  const sendTestWhatsApp = async () => {
    const user = selectedUser;
    if (!user) return Alert.alert("Select a user first");
    if (!user.phone) return Alert.alert("No phone number for this user.");
    setBusy("test_wa");
    try {
      await sendTestWhatsAppCallable({ phone: user.phone });
      addLog(`Test WhatsApp sent to ${user.phone}`, true);
    } catch (e: any) {
      addLog(`WhatsApp error: ${e?.message}`, false);
    } finally {
      setBusy(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Reset delivery status for today (testing re-run)
  // ---------------------------------------------------------------------------
  const resetTodayDelivery = async () => {
    if (!selectedSub) return Alert.alert("No subscription selected");
    Alert.alert(
      "Reset today's delivery?",
      "This will clear today's delivery status and logs for this subscription.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setBusy("reset_delivery");
            try {
              const date = todayStr();
              const sub = await db.getSubscriptionById(selectedSub.id);
              if (!sub) return;
              const deliveryStatusByDate = { ...(sub.deliveryStatusByDate || {}) };
              delete deliveryStatusByDate[date];
              const deliveryDayLogs = { ...(sub.deliveryDayLogs || {}) };
              delete deliveryDayLogs[date];
              await db.updateSubscription(selectedSub.id, { deliveryStatusByDate, deliveryDayLogs } as any);
              const updated = await db.getSubscriptionById(selectedSub.id);
              if (updated) setSelectedSub(updated);
              addLog("Today's delivery status reset", true);
            } catch (e: any) {
              addLog(`Reset error: ${e?.message}`, false);
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // Copy token to clipboard
  // ---------------------------------------------------------------------------
  const copyToken = (token: string) => {
    Clipboard.setString(token);
    addLog("Token copied to clipboard", true);
    Alert.alert("Copied!", token.slice(0, 60) + "…");
  };

  // ---------------------------------------------------------------------------
  // Computed current delivery status for today
  // ---------------------------------------------------------------------------
  const todayDeliveryStatus = selectedSub?.deliveryStatusByDate?.[todayStr()] as DeliveryStatus | undefined;
  const currentDeliveryStepIdx = todayDeliveryStatus
    ? DELIVERY_STEPS.findIndex((s) => s.key === todayDeliveryStatus)
    : -1;

  // ---------------------------------------------------------------------------
  // Filtered users
  // ---------------------------------------------------------------------------
  const filteredUsers = users.filter((u) =>
    !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.phone?.includes(userSearch)
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Notification Tester</Text>
          <Text style={styles.headerSub}>Admin dev panel</Text>
        </View>
        <TouchableOpacity onPress={reload} style={styles.refreshBtn}>
          <RefreshCw size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#48479B" size="large" />
          <Text style={styles.loadingText}>Loading users & subscriptions…</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Section: User Picker ─────────────────────────── */}
          <SectionHeader icon={Users} title="1. Select User" />

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowUserPicker(true)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerLabel}>User</Text>
              <Text style={styles.pickerValue}>
                {selectedUser ? `${selectedUser.name} · ${selectedUser.phone}` : "Tap to select a user…"}
              </Text>
            </View>
            <ChevronDown size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {selectedUser && (
            <View style={styles.infoCard}>
              <InfoRow label="ID" value={selectedUser.id.slice(-12)} />
              <InfoRow label="Phone" value={selectedUser.phone || "–"} />
              <InfoRow label="Role" value={selectedUser.role} />
              <InfoRow label="Wallet" value={`₹${selectedUser.walletBalance?.toFixed(2) ?? "0"}`} />
              <View style={styles.tokenRow}>
                <Text style={styles.infoLabel}>Push Token</Text>
                {selectedUser.pushToken ? (
                  <View style={styles.tokenValueRow}>
                    <Text style={styles.tokenValue} numberOfLines={1}>
                      {selectedUser.pushToken.slice(0, 32)}…
                    </Text>
                    <TouchableOpacity onPress={() => copyToken(selectedUser.pushToken!)} style={styles.copyBtn}>
                      <Copy size={14} color="#48479B" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noTokenBadge}>
                    <X size={12} color="#fff" />
                    <Text style={styles.noTokenText}>No token</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── Section: Subscription Picker ─────────────────── */}
          <SectionHeader icon={Package} title="2. Select Subscription" />

          <TouchableOpacity
            style={[styles.pickerBtn, !selectedUser && styles.pickerBtnDisabled]}
            onPress={() => selectedUser && setShowSubPicker(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerLabel}>Subscription</Text>
              <Text style={styles.pickerValue}>
                {!selectedUser
                  ? "Select a user first"
                  : selectedSub
                  ? `${selectedSub.planName || "Plan " + selectedSub.planId} · #${selectedSub.id.slice(-6)}`
                  : userSubs.length === 0
                  ? "No subscriptions for this user"
                  : "Tap to select…"}
              </Text>
            </View>
            {selectedUser && userSubs.length > 0 && <ChevronDown size={18} color="#9CA3AF" />}
          </TouchableOpacity>

          {selectedSub && (
            <View style={styles.infoCard}>
              <InfoRow label="Plan" value={selectedSub.planName || selectedSub.planId} />
              <InfoRow label="Status" value={selectedSub.status} />
              <InfoRow label="Start" value={new Date(selectedSub.startDate).toLocaleDateString("en-IN")} />
              <InfoRow label="End" value={new Date(selectedSub.endDate).toLocaleDateString("en-IN")} />
              <InfoRow
                label="Today delivery"
                value={todayDeliveryStatus ?? "not set"}
              />
            </View>
          )}

          {/* ── Section: Delivery Status ────────────────────── */}
          {selectedSub && (
            <>
              <SectionHeader icon={Truck} title="3. Delivery Status (Today)" />

              {/* Step indicators */}
              <View style={styles.stepsRow}>
                {DELIVERY_STEPS.map((step, idx) => {
                  const done = idx <= currentDeliveryStepIdx;
                  const current = idx === currentDeliveryStepIdx;
                  const StepIcon = step.icon;
                  return (
                    <React.Fragment key={step.key}>
                      <View style={styles.stepWrap}>
                        <View style={[
                          styles.stepCircle,
                          { borderColor: step.color },
                          done && { backgroundColor: step.color },
                        ]}>
                          <StepIcon size={13} color={done ? "#fff" : step.color} />
                        </View>
                        <Text style={[styles.stepLabel, current && { color: step.color, fontWeight: "700" }]}>
                          {step.label}
                        </Text>
                      </View>
                      {idx < DELIVERY_STEPS.length - 1 && (
                        <View style={[styles.stepLine, idx < currentDeliveryStepIdx && { backgroundColor: "#10B981" }]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              {/* Action buttons */}
              <View style={styles.actionsGrid}>
                {DELIVERY_STEPS.map((step) => {
                  const isBusy = busy === `delivery_${step.key}`;
                  const isDone = todayDeliveryStatus === step.key;
                  return (
                    <TouchableOpacity
                      key={step.key}
                      style={[
                        styles.actionBtn,
                        { borderColor: step.color },
                        isDone && { backgroundColor: step.color },
                      ]}
                      onPress={() => setDeliveryStatus(step.key)}
                      disabled={!!busy}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={isDone ? "#fff" : step.color} />
                      ) : (
                        <step.icon size={14} color={isDone ? "#fff" : step.color} />
                      )}
                      <Text style={[styles.actionBtnText, { color: isDone ? "#fff" : step.color }]}>
                        {step.label}
                      </Text>
                      {isDone && <Check size={12} color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.resetBtn} onPress={resetTodayDelivery} disabled={!!busy}>
                <RefreshCw size={14} color="#9CA3AF" />
                <Text style={styles.resetBtnText}>Reset Today's Delivery</Text>
              </TouchableOpacity>

              {/* ── Subscription Lifecycle ───────────────── */}
              <SectionHeader icon={ToggleLeft} title="4. Subscription Status" />
              <View style={styles.pillRow}>
                {SUB_STATUSES.map((s) => {
                  const isBusy = busy === `sub_${s.key}`;
                  const isCurrent = selectedSub.status === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        styles.statusPill,
                        { borderColor: s.color },
                        isCurrent && { backgroundColor: s.color },
                      ]}
                      onPress={() => setSubStatus(s.key)}
                      disabled={!!busy || isCurrent}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={isCurrent ? "#fff" : s.color} />
                      ) : null}
                      <Text style={[styles.statusPillText, { color: isCurrent ? "#fff" : s.color }]}>
                        {s.key}
                        {isCurrent ? " ✓" : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Section: Test Notifications ─────────────────── */}
          <SectionHeader icon={Bell} title={selectedSub ? "5. Send Test Notifications" : "3. Send Test Notifications"} />

          {/* Toggles */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleItem}>
              <Bell size={16} color="#48479B" />
              <Text style={styles.toggleLabel}>Push Notification</Text>
              <Switch
                value={sendPush}
                onValueChange={setSendPush}
                trackColor={{ true: "#48479B", false: "#374151" }}
                thumbColor={sendPush ? "#fff" : "#9CA3AF"}
              />
            </View>
            <View style={styles.toggleItem}>
              <MessageSquare size={16} color="#25D366" />
              <Text style={styles.toggleLabel}>WhatsApp</Text>
              <Switch
                value={sendWhatsApp}
                onValueChange={setSendWhatsApp}
                trackColor={{ true: "#25D366", false: "#374151" }}
                thumbColor={sendWhatsApp ? "#fff" : "#9CA3AF"}
              />
            </View>
          </View>

          {/* Test action buttons */}
          <View style={styles.testBtnRow}>
            <TouchableOpacity
              style={[styles.testBtn, styles.testBtnPush]}
              onPress={sendTestPush}
              disabled={!!busy || !selectedUser}
            >
              {busy === "test_push" ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Bell size={18} color="#fff" />
              )}
              <Text style={styles.testBtnText}>Test Push</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testBtn, styles.testBtnWA]}
              onPress={sendTestWhatsApp}
              disabled={!!busy || !selectedUser}
            >
              {busy === "test_wa" ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <MessageSquare size={18} color="#fff" />
              )}
              <Text style={styles.testBtnText}>Test WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* ── Activity Log ─────────────────────────────────── */}
          {log.length > 0 && (
            <>
              <SectionHeader icon={Zap} title="Activity Log" />
              <View style={styles.logCard}>
                {log.map((entry, i) => (
                  <View key={i} style={styles.logEntry}>
                    <View style={[styles.logDot, { backgroundColor: entry.ok ? "#10B981" : "#EF4444" }]} />
                    <Text style={styles.logTime}>{entry.ts}</Text>
                    <Text style={[styles.logMsg, { color: entry.ok ? "#E5E7EB" : "#FCA5A5" }]}>
                      {entry.msg}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── User Picker Modal ──────────────────────────────── */}
      <Modal visible={showUserPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select User</Text>
              <TouchableOpacity onPress={() => { setShowUserPicker(false); setUserSearch(""); }}>
                <X size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Search size={16} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or phone…"
                placeholderTextColor="#6B7280"
                value={userSearch}
                onChangeText={setUserSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredUsers}
              keyExtractor={(u) => u.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.listItem, item.id === selectedUser?.id && styles.listItemSelected]}
                  onPress={() => {
                    setSelectedUser(item);
                    setShowUserPicker(false);
                    setUserSearch("");
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemTitle}>{item.name || "Unnamed"}</Text>
                    <Text style={styles.listItemSub}>{item.phone} · {item.role}</Text>
                  </View>
                  {item.pushToken ? (
                    <View style={styles.tokenBadge}><Bell size={12} color="#10B981" /></View>
                  ) : (
                    <View style={[styles.tokenBadge, { backgroundColor: "#374151" }]}><Bell size={12} color="#6B7280" /></View>
                  )}
                  {item.id === selectedUser?.id && <Check size={16} color="#48479B" />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
              style={{ maxHeight: 400 }}
            />
          </View>
        </View>
      </Modal>

      {/* ── Subscription Picker Modal ──────────────────────── */}
      <Modal visible={showSubPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subscription</Text>
              <TouchableOpacity onPress={() => setShowSubPicker(false)}>
                <X size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={userSubs}
              keyExtractor={(s) => s.id}
              renderItem={({ item }) => {
                const statusColor = item.status === "active" ? "#10B981" : item.status === "paused" ? "#F59E0B" : "#EF4444";
                return (
                  <TouchableOpacity
                    style={[styles.listItem, item.id === selectedSub?.id && styles.listItemSelected]}
                    onPress={() => { setSelectedSub(item); setShowSubPicker(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listItemTitle}>{item.planName || `Plan ${item.planId}`}</Text>
                      <Text style={styles.listItemSub}>
                        #{item.id.slice(-8)} · {new Date(item.startDate).toLocaleDateString("en-IN")} → {new Date(item.endDate).toLocaleDateString("en-IN")}
                      </Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.listItemStatus, { color: statusColor }]}>{item.status}</Text>
                    {item.id === selectedSub?.id && <Check size={16} color="#48479B" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No subscriptions</Text>}
              style={{ maxHeight: 400 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Icon size={16} color="#48479B" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1220" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
    gap: 14,
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  headerSub: { color: "#6B7280", fontSize: 12, marginTop: 1 },
  refreshBtn: { marginLeft: "auto" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#9CA3AF", fontSize: 14 },
  content: { padding: 16, gap: 10 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pickerBtnDisabled: { opacity: 0.4 },
  pickerLabel: { color: "#6B7280", fontSize: 11, marginBottom: 2 },
  pickerValue: { color: "#E5E7EB", fontSize: 14, fontWeight: "500" },

  infoCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { color: "#6B7280", fontSize: 12 },
  infoValue: { color: "#E5E7EB", fontSize: 12, fontWeight: "600" },
  tokenRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tokenValueRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" },
  tokenValue: { color: "#E5E7EB", fontSize: 11, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", flex: 1, textAlign: "right" },
  copyBtn: { padding: 4 },
  noTokenBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  noTokenText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  stepsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stepWrap: { alignItems: "center", gap: 4, flex: 1 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  stepLabel: { color: "#6B7280", fontSize: 9, textAlign: "center" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#374151", marginTop: 13 },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  actionBtnText: { fontSize: 12, fontWeight: "700" },

  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  resetBtnText: { color: "#9CA3AF", fontSize: 12 },

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  statusPillText: { fontSize: 13, fontWeight: "700", textTransform: "capitalize" },

  toggleRow: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  toggleItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLabel: { flex: 1, color: "#E5E7EB", fontSize: 14, fontWeight: "500" },

  testBtnRow: { flexDirection: "row", gap: 12 },
  testBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
  },
  testBtnPush: { backgroundColor: "#48479B" },
  testBtnWA: { backgroundColor: "#25D366" },
  testBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  logCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
    gap: 8,
  },
  logEntry: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  logDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 4 },
  logTime: { color: "#6B7280", fontSize: 11, minWidth: 55 },
  logMsg: { flex: 1, fontSize: 12, lineHeight: 17 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#1F2937",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchInput: { flex: 1, color: "#E5E7EB", fontSize: 15 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    gap: 10,
  },
  listItemSelected: { backgroundColor: "rgba(229,57,53,0.1)" },
  listItemTitle: { color: "#E5E7EB", fontSize: 14, fontWeight: "700" },
  listItemSub: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  listItemStatus: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  tokenBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#064E3B",
    justifyContent: "center",
    alignItems: "center",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyText: { color: "#6B7280", textAlign: "center", padding: 24 },
});
