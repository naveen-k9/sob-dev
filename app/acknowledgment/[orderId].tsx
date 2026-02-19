import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { CheckCircle2, Package, Truck, ArrowLeft, MapPin } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import db from "@/db";
import { Order } from "@/types";

export default function AcknowledgmentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      if (!orderId || typeof orderId !== "string") { setLoading(false); return; }
      const orders = await db.getOrders();
      setOrder(orders.find((o) => o.id === orderId) ?? null);
    } catch (e) {
      console.log("[Ack] load error", e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const handleMarkReceived = async () => {
    if (!order?.id) return;
    try {
      setSubmitting(true);
      const updated = await db.markDeliveryAsReceived(order.id);
      if (updated) {
        setOrder(updated);
        Alert.alert("Thank you! 🙏", "Delivery confirmed. Enjoy your meal!", [
          { text: "Great!", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", "Unable to update. Please try again.");
      }
    } catch (e) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canAck = order?.status === "waiting_for_ack" || order?.status === "out_for_delivery";
  const isDelivered = order?.status === "delivered";

  const STATUS_STEPS = [
    { key: "confirmed",    label: "Confirmed",   Icon: Package },
    { key: "preparing",    label: "Preparing",   Icon: Package },
    { key: "out_for_delivery", label: "On the way", Icon: Truck },
    { key: "waiting_for_ack", label: "Arrived",  Icon: MapPin },
    { key: "delivered",    label: "Delivered",   Icon: CheckCircle2 },
  ];
  const currentStatusIdx = order
    ? STATUS_STEPS.findIndex((s) => s.key === order.status)
    : -1;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Delivery</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#E53935" />
            <Text style={styles.loadingText}>Loading order…</Text>
          </View>
        ) : !order ? (
          <View style={styles.center}>
            <Package size={52} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Order not found</Text>
            <Text style={styles.emptySub}>We couldn't find this order.</Text>
          </View>
        ) : isDelivered ? (
          <View style={styles.successCard}>
            <LinearGradient colors={["#ECFDF5", "#D1FAE5"]} style={styles.successGrad}>
              <CheckCircle2 size={56} color="#10B981" />
              <Text style={styles.successTitle}>Delivered!</Text>
              <Text style={styles.successSub}>You've confirmed receipt. Enjoy your meal!</Text>
            </LinearGradient>
          </View>
        ) : (
          <>
            {/* Status card */}
            <View style={styles.statusCard}>
              <LinearGradient colors={["#FFF7F0", "#FFF0E6"]} style={styles.statusGrad}>
                <View style={styles.orderRow}>
                  <View style={styles.orderIconWrap}>
                    <Truck size={26} color="#E53935" />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderIdText}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                    <View style={[styles.statusPill, canAck ? styles.statusPillActive : styles.statusPillNeutral]}>
                      <Text style={[styles.statusPillText, canAck ? styles.statusPillTextActive : styles.statusPillTextNeutral]}>
                        {order.status.replace(/_/g, " ")}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.stepsRow}>
                  {STATUS_STEPS.map((step, idx) => {
                    const done = idx <= currentStatusIdx;
                    const StepIcon = step.Icon;
                    return (
                      <React.Fragment key={step.key}>
                        <View style={styles.step}>
                          <View style={[styles.stepCircle, done && styles.stepCircleDone]}>
                            <StepIcon size={14} color={done ? "#fff" : "#9CA3AF"} />
                          </View>
                          <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step.label}</Text>
                        </View>
                        {idx < STATUS_STEPS.length - 1 && (
                          <View style={[styles.stepLine, done && idx < currentStatusIdx && styles.stepLineDone]} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              </LinearGradient>
            </View>

            <Text style={styles.helpText}>
              Please confirm that you have received your order. This keeps our delivery quality in check.
            </Text>

            <TouchableOpacity
              testID="mark-received"
              style={[styles.cta, !canAck && styles.ctaDisabled]}
              onPress={handleMarkReceived}
              disabled={!canAck || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CheckCircle2 size={22} color="#fff" />
                  <Text style={styles.ctaText}>Yes, I received my order</Text>
                </>
              )}
            </TouchableOpacity>

            {!canAck && (
              <Text style={styles.notAvail}>
                Acknowledgement is only available when your order has arrived.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  container: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80, gap: 12 },
  loadingText: { color: "#6B7280", fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  emptySub: { fontSize: 14, color: "#6B7280" },
  successCard: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  successGrad: { padding: 32, alignItems: "center", gap: 12 },
  successTitle: { fontSize: 24, fontWeight: "800", color: "#065F46" },
  successSub: { fontSize: 14, color: "#047857", textAlign: "center" },
  statusCard: { borderRadius: 16, overflow: "hidden", marginBottom: 20, elevation: 2, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  statusGrad: { padding: 20, gap: 20 },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  orderIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2, shadowColor: "#E53935", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  orderInfo: { flex: 1, gap: 6 },
  orderIdText: { fontSize: 15, fontWeight: "700", color: "#111" },
  statusPill: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillActive: { backgroundColor: "#FEE2E2" },
  statusPillNeutral: { backgroundColor: "#F3F4F6" },
  statusPillText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  statusPillTextActive: { color: "#E53935" },
  statusPillTextNeutral: { color: "#374151" },
  stepsRow: { flexDirection: "row", alignItems: "center" },
  step: { alignItems: "center", gap: 4 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  stepCircleDone: { backgroundColor: "#10B981" },
  stepLabel: { fontSize: 9, color: "#9CA3AF", textAlign: "center", maxWidth: 48 },
  stepLabelDone: { color: "#047857", fontWeight: "600" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#E5E7EB", marginBottom: 16 },
  stepLineDone: { backgroundColor: "#10B981" },
  helpText: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20, marginBottom: 24, paddingHorizontal: 8 },
  cta: {
    backgroundColor: "#E53935", borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    elevation: 3, shadowColor: "#E53935", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  ctaDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  notAvail: { color: "#9CA3AF", textAlign: "center", marginTop: 12, fontSize: 13 },
});
