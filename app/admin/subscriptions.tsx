import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import db from "@/db";
import { Subscription, User } from "@/types";
import { Calendar, Package, Clock, Pencil, Check } from "lucide-react-native";

const SUBSCRIPTION_STATUSES: Subscription["status"][] = [
  "active",
  "paused",
  "cancelled",
  "completed",
];

export default function AdminSubscriptionsScreen() {
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState<string>("");
  const [status, setStatus] = useState<"all" | Subscription["status"]>("all");
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editStatus, setEditStatus] = useState<Subscription["status"]>("active");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([db.getSubscriptions(), db.getUsers()]);
      setSubs(s);
      setUsers(u);
    } catch (e) {
      console.log("load subscriptions error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
      return () => {};
    }, [])
  );

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return subs.filter((s) => {
      const u = users.find((x) => x.id === s.userId);
      const matchesQ =
        !ql ||
        (u?.name?.toLowerCase().includes(ql) ?? false) ||
        (u?.phone?.toLowerCase().includes(ql) ?? false) ||
        s.id.toLowerCase().includes(ql);
      const matchesStatus = status === "all" ? true : s.status === status;
      return matchesQ && matchesStatus;
    });
  }, [subs, users, q, status]);

  const openEdit = (item: Subscription) => {
    router.push({ pathname: "/admin/subscription-edit", params: { id: item.id } });
  };

  const openQuickStatus = (item: Subscription, e: any) => {
    e?.stopPropagation?.();
    setEditingSub(item);
    setEditStatus(item.status);
  };

  const saveEdit = async () => {
    if (!editingSub || editStatus === editingSub.status) {
      setEditingSub(null);
      return;
    }
    setSaving(true);
    try {
      await db.updateSubscription(editingSub.id, { status: editStatus });
      setSubs((prev) =>
        prev.map((s) =>
          s.id === editingSub.id ? { ...s, status: editStatus } : s
        )
      );
      setEditingSub(null);
    } catch (e) {
      console.error("Failed to update subscription", e);
      Alert.alert("Error", "Failed to save subscription status");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Subscription }) => {
    const u = users.find((x) => x.id === item.userId);
    const delivered =
      (item.totalDeliveries ?? 0) - (item.remainingDeliveries ?? 0);
    const fmt = (d: Date) =>
      new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

    return (
      <TouchableOpacity
        style={styles.card}
        testID={`subscription-${item.id}`}
        onPress={() => openEdit(item)}
        activeOpacity={0.8}
      >
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {u?.name ?? "Unknown"} • {u?.phone ?? ""}
            </Text>
            <Text style={styles.subId}>#{item.id.slice(-6)}</Text>
          </View>
          <View style={styles.badgeRow}>
            <TouchableOpacity
              onPress={(e) => openQuickStatus(item, e)}
              style={[styles.badge, { backgroundColor: badgeColor(item.status) }]}
            >
              <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
            </TouchableOpacity>
            <Pencil size={16} color="#9CA3AF" style={styles.editIcon} />
          </View>
        </View>
        <View style={styles.metaRow}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.metaText}>
            {fmt(item.startDate)} - {fmt(item.endDate)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Package size={16} color="#6B7280" />
          <Text style={styles.metaText}>
            {delivered}/{item.totalDeliveries ?? 0} meals delivered
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.metaText}>
            Delivery: {item.deliveryTime ?? item.deliveryTimeSlot}
          </Text>
        </View>
        {(item.promoCode || item.appliedOfferId) && (item.promoDiscountAmount ?? 0) > 0 && (
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Offer: {item.promoCode ?? item.appliedOfferId} (-₹{item.promoDiscountAmount ?? 0})
            </Text>
          </View>
        )}
        {(item.walletPaidAmount ?? 0) > 0 && (
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Wallet: ₹{item.walletPaidAmount}</Text>
          </View>
        )}
        <View style={styles.footer}>
          <Text style={styles.amount}>₹{item.totalAmount}</Text>
          <Text style={styles.paid}>Paid: ₹{item.paidAmount ?? 0}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Subscriptions</Text>
        <View style={styles.filters}>
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search name, phone, id"
              placeholderTextColor="#9CA3AF"
              value={q}
              onChangeText={setQ}
              style={styles.input}
              testID="subs-search-input"
            />
          </View>
          <View style={styles.statusRow}>
            {(
              ["all", "active", "paused", "cancelled", "completed"] as const
            ).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                style={[styles.chip, status === s && styles.chipActive]}
                testID={`subs-status-${s}`}
              >
                <Text
                  style={[
                    styles.chipText,
                    status === s && styles.chipTextActive,
                  ]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#48479B" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No subscriptions found</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}

        <Modal
          visible={!!editingSub}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingSub(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setEditingSub(null)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Edit subscription status</Text>
              {editingSub && (
                <Text style={styles.modalSubId}>#{editingSub.id.slice(-8)}</Text>
              )}
              <View style={styles.statusOptions}>
                {SUBSCRIPTION_STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      editStatus === s && {
                        backgroundColor: badgeColor(s),
                        borderColor: badgeColor(s),
                      },
                    ]}
                    onPress={() => setEditStatus(s)}
                    testID={`edit-status-${s}`}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        editStatus === s && styles.statusOptionTextActive,
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setEditingSub(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSave, saving && styles.modalSaveDisabled]}
                  onPress={saveEdit}
                  disabled={saving}
                  testID="edit-subscription-save"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Check size={18} color="#fff" />
                      <Text style={styles.modalSaveText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function badgeColor(status: Subscription["status"]): string {
  switch (status) {
    case "active":
      return "#10B981";
    case "paused":
      return "#F59E0B";
    case "cancelled":
      return "#EF4444";
    case "completed":
      return "#6B7280";
    default:
      return "#6B7280";
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1220" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  title: { color: "white", fontSize: 24, fontWeight: "900", marginBottom: 12 },
  filters: { marginBottom: 12 },
  searchBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  input: { color: "white", fontSize: 16 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
  },
  chipActive: { backgroundColor: "#48479B", borderColor: "#48479B" },
  chipText: { color: "#CBD5E1", fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "white" },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  name: { color: "white", fontSize: 16, fontWeight: "800" },
  subId: { color: "#6B7280", fontSize: 11 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: "white", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  metaText: { marginLeft: 8, color: "#9CA3AF", fontSize: 14 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  amount: { color: "#10B981", fontSize: 17, fontWeight: "900" },
  paid: { color: "#9CA3AF", fontSize: 14 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editIcon: { opacity: 0.8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  modalSubId: { color: "#9CA3AF", fontSize: 12, marginBottom: 16 },
  statusOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  statusOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4B5563",
  },
  statusOptionText: { color: "#9CA3AF", fontSize: 14, fontWeight: "600" },
  statusOptionTextActive: { color: "#fff" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: "#9CA3AF", fontSize: 16 },
  modalSave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#48479B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalSaveDisabled: { opacity: 0.6 },
  modalSaveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyText: { color: "white", fontSize: 14 },
});
