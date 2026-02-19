import React, { useCallback, useEffect, useState } from "react";
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
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, Package, ChefHat, Clock, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import db from "@/db";
import { Subscription } from "@/types";

export default function SubscriptionAckScreen() {
  const { subscriptionId, date } = useLocalSearchParams<{
    subscriptionId?: string;
    date?: string;
  }>();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const load = useCallback(async () => {
    try {
      if (!subscriptionId) return;
      const sub = await db.getSubscriptionById(subscriptionId);
      setSubscription(sub);
      if (sub && date && (sub as any).deliveryAckByDate?.[date]) {
        setAcknowledged(true);
      }
    } catch (e) {
      console.log("[SubAck] load error", e);
    } finally {
      setLoading(false);
    }
  }, [subscriptionId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkReceived = async () => {
    if (!subscriptionId || !date) return;
    try {
      setSubmitting(true);
      await db.markSubscriptionDeliveryReceived(subscriptionId, date);
      setAcknowledged(true);
      Alert.alert("Thank you! 🙏", "Delivery confirmed. Enjoy your meal!", [
        { text: "Great!", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log("[SubAck] confirm error", e);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const deliveryStatus = subscription?.deliveryStatusByDate?.[date || ""] || "unknown";
  const canAck = deliveryStatus === "delivery_done" && !acknowledged;
  const mealName = subscription
    ? `Meal #${subscription.mealId}`
    : "Your Meal";

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
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
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : !subscription ? (
          <View style={styles.center}>
            <Package size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Subscription not found</Text>
            <Text style={styles.emptySubtitle}>We couldn't find this subscription.</Text>
          </View>
        ) : acknowledged ? (
          <View style={styles.successCard}>
            <LinearGradient colors={["#ECFDF5", "#D1FAE5"]} style={styles.successGradient}>
              <CheckCircle2 size={56} color="#10B981" />
              <Text style={styles.successTitle}>Delivery Confirmed!</Text>
              <Text style={styles.successSub}>Thank you for confirming. Enjoy your meal!</Text>
            </LinearGradient>
          </View>
        ) : (
          <>
            {/* Meal Info Card */}
            <View style={styles.card}>
              <LinearGradient colors={["#FFF7F0", "#FFF0E6"]} style={styles.cardGradient}>
                <View style={styles.iconRow}>
                  <View style={styles.iconCircle}>
                    <Package size={28} color="#E53935" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{mealName}</Text>
                    <Text style={styles.cardDate}>
                      {date ? new Date(date).toLocaleDateString("en-IN", {
                        weekday: "long", day: "numeric", month: "long",
                      }) : "Today"}
                    </Text>
                  </View>
                </View>

                {/* Status Steps */}
                <View style={styles.stepsRow}>
                  {[
                    { key: "packaging", icon: Package, label: "Packed" },
                    { key: "delivery_started", icon: ChefHat, label: "Picked up" },
                    { key: "delivery_done", icon: CheckCircle2, label: "Delivered" },
                  ].map((step, idx) => {
                    const statusOrder = ["packaging", "packaging_done", "delivery_started", "reached", "delivery_done"];
                    const currentIdx = statusOrder.indexOf(deliveryStatus);
                    const stepIdx = statusOrder.indexOf(step.key);
                    const done = currentIdx >= stepIdx;
                    const StepIcon = step.icon;
                    return (
                      <React.Fragment key={step.key}>
                        <View style={styles.step}>
                          <View style={[styles.stepCircle, done && styles.stepCircleActive]}>
                            <StepIcon size={16} color={done ? "#fff" : "#9CA3AF"} />
                          </View>
                          <Text style={[styles.stepLabel, done && styles.stepLabelActive]}>{step.label}</Text>
                        </View>
                        {idx < 2 && <View style={[styles.stepLine, done && styles.stepLineActive]} />}
                      </React.Fragment>
                    );
                  })}
                </View>
              </LinearGradient>
            </View>

            <Text style={styles.helpText}>
              Please confirm that you have received your meal today. This helps us ensure delivery quality.
            </Text>

            <TouchableOpacity
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
                  <Text style={styles.ctaText}>Yes, I received my meal</Text>
                </>
              )}
            </TouchableOpacity>

            {!canAck && !acknowledged && (
              <Text style={styles.notAvail}>
                {deliveryStatus === "delivery_done"
                  ? "Already confirmed."
                  : "Delivery not yet marked as done."}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#6B7280", fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", marginTop: 6, textAlign: "center" },
  successCard: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  successGradient: { padding: 32, alignItems: "center", gap: 12 },
  successTitle: { fontSize: 22, fontWeight: "800", color: "#065F46" },
  successSub: { fontSize: 14, color: "#047857", textAlign: "center" },
  card: { borderRadius: 16, overflow: "hidden", marginBottom: 20, elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardGradient: { padding: 20 },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2, shadowColor: "#E53935", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  cardDate: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  stepsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  step: { alignItems: "center", gap: 4 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  stepCircleActive: { backgroundColor: "#10B981" },
  stepLabel: { fontSize: 10, color: "#9CA3AF", textAlign: "center" },
  stepLabelActive: { color: "#047857", fontWeight: "600" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#E5E7EB", marginBottom: 14 },
  stepLineActive: { backgroundColor: "#10B981" },
  helpText: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20, marginBottom: 24, paddingHorizontal: 8 },
  cta: { backgroundColor: "#E53935", borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, elevation: 3, shadowColor: "#E53935", shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  ctaDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  notAvail: { color: "#9CA3AF", textAlign: "center", marginTop: 12, fontSize: 13 },
});
