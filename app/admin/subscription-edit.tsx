import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import db from "@/db";
import { Subscription, User, Meal, Plan, Address } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Package,
  DollarSign,
  Check,
  ChevronDown,
  FileText,
  Truck,
  ChefHat,
} from "lucide-react-native";

const WEEK_TYPES: Subscription["weekType"][] = ["none", "mon-fri", "mon-sat", "everyday"];
const STATUSES: Subscription["status"][] = ["active", "paused", "cancelled", "completed"];
const TIME_SLOTS = [
  "12:00 PM - 2:00 PM",
  "7:00 PM - 9:00 PM",
  "6:00 PM - 8:00 PM",
  "1:00 PM - 3:00 PM",
];

export default function SubscriptionEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state (mirrors Subscription fields)
  const [status, setStatus] = useState<Subscription["status"]>("active");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [weekType, setWeekType] = useState<Subscription["weekType"]>("mon-fri");
  const [weekendExclusion, setWeekendExclusion] = useState("");
  const [remainingDeliveries, setRemainingDeliveries] = useState("");
  const [totalDeliveries, setTotalDeliveries] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [mealId, setMealId] = useState("");
  const [planId, setPlanId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [addOns, setAddOns] = useState<string[]>([]);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWeekTypeModal, setShowWeekTypeModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [subscription, allUsers, allMeals, allPlans] = await Promise.all([
          db.getSubscriptionById(id),
          db.getUsers(),
          db.getMeals(),
          db.getPlans(),
        ]);
        if (!subscription) {
          Alert.alert("Error", "Subscription not found");
          router.back();
          return;
        }
        setSub(subscription);
        setUsers(allUsers);
        setMeals(allMeals.filter((m) => m.isActive));
        setPlans(allPlans.filter((p) => p.isActive));

        const s = subscription;
        setStatus(s.status);
        setStartDateStr(s.startDate ? new Date(s.startDate).toISOString().slice(0, 10) : "");
        setEndDateStr(s.endDate ? new Date(s.endDate).toISOString().slice(0, 10) : "");
        setDeliveryTime(s.deliveryTime || s.deliveryTimeSlot || TIME_SLOTS[0]);
        setWeekType(s.weekType || "mon-fri");
        setWeekendExclusion(s.weekendExclusion || "");
        setRemainingDeliveries(String(s.remainingDeliveries ?? ""));
        setTotalDeliveries(String(s.totalDeliveries ?? ""));
        setTotalAmount(String(s.totalAmount ?? ""));
        setPaidAmount(String(s.paidAmount ?? ""));
        setSpecialInstructions(s.specialInstructions || "");
        setMealId(s.mealId || "");
        setPlanId(s.planId || "");
        setAddressId(s.addressId || "");
        setAddOns(s.addOns || []);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Failed to load subscription");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const user = users.find((u) => u.id === sub?.userId);
  const addresses: Address[] = user?.addresses ?? [];
  const selectedMeal = meals.find((m) => m.id === mealId);
  const selectedPlan = plans.find((p) => p.id === planId);

  const buildUpdates = (): Partial<Subscription> => {
    const updates: Partial<Subscription> = {
      status,
      deliveryTime,
      deliveryTimeSlot: deliveryTime,
      weekType,
      weekendExclusion: weekendExclusion || undefined,
      specialInstructions: specialInstructions || undefined,
      mealId: mealId || undefined,
      planId: planId || undefined,
      addressId: addressId || undefined,
      addOns: addOns.length ? addOns : undefined,
    };
    const start = startDateStr ? new Date(startDateStr) : null;
    const end = endDateStr ? new Date(endDateStr) : null;
    if (start) updates.startDate = start;
    if (end) updates.endDate = end;
    const rem = parseInt(remainingDeliveries, 10);
    const tot = parseInt(totalDeliveries, 10);
    if (!isNaN(rem)) updates.remainingDeliveries = rem;
    if (!isNaN(tot)) updates.totalDeliveries = tot;
    const amt = parseFloat(totalAmount);
    const paid = parseFloat(paidAmount);
    if (!isNaN(amt)) updates.totalAmount = amt;
    if (!isNaN(paid)) updates.paidAmount = paid;
    return updates;
  };

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await db.updateSubscription(id, buildUpdates());
      Alert.alert("Saved", "Subscription updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save subscription");
    } finally {
      setSaving(false);
    }
  };

  const deliveryDayLogs = sub?.deliveryDayLogs ?? {};
  const logDates = Object.keys(deliveryDayLogs).sort((a, b) => b.localeCompare(a));

  if (loading || !sub) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#48479B" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: "Edit Subscription",
          headerStyle: { backgroundColor: "#1F2937" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Status & schedule</Text>
        <TouchableOpacity style={styles.field} onPress={() => setShowStatusModal(true)}>
          <Text style={styles.fieldLabel}>Status</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldValue}>{status}</Text>
            <ChevronDown size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Start date</Text>
          <TextInput
            style={styles.input}
            value={startDateStr}
            onChangeText={setStartDateStr}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#6B7280"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>End date</Text>
          <TextInput
            style={styles.input}
            value={endDateStr}
            onChangeText={setEndDateStr}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#6B7280"
          />
        </View>
        <TouchableOpacity style={styles.field} onPress={() => setShowTimeModal(true)}>
          <Clock size={18} color="#9CA3AF" />
          <Text style={[styles.fieldValue, { marginLeft: 8 }]}>{deliveryTime}</Text>
          <ChevronDown size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.field} onPress={() => setShowWeekTypeModal(true)}>
          <Text style={styles.fieldLabel}>Week type</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldValue}>{weekType}</Text>
            <ChevronDown size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Weekend exclusion (e.g. sunday, both)</Text>
          <TextInput
            style={styles.input}
            value={weekendExclusion}
            onChangeText={setWeekendExclusion}
            placeholder="Optional"
            placeholderTextColor="#6B7280"
          />
        </View>

        <Text style={styles.sectionTitle}>Meal & plan</Text>
        <TouchableOpacity style={styles.field} onPress={() => setShowMealModal(true)}>
          <Package size={18} color="#9CA3AF" />
          <Text style={[styles.fieldValue, { flex: 1, marginLeft: 8 }]}>
            {selectedMeal?.name ?? (mealId || "Select meal")}
          </Text>
          <ChevronDown size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.field} onPress={() => setShowPlanModal(true)}>
          <Calendar size={18} color="#9CA3AF" />
          <Text style={[styles.fieldValue, { flex: 1, marginLeft: 8 }]}>
            {selectedPlan?.name ?? (planId || "Select plan")}
          </Text>
          <ChevronDown size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Address</Text>
        <TouchableOpacity style={styles.field} onPress={() => setShowAddressModal(true)}>
          <Text style={styles.fieldLabel}>Delivery address</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {addresses.find((a) => a.id === addressId)?.addressLine ?? (addressId || "Select address")}
            </Text>
            <ChevronDown size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Amounts & deliveries</Text>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Total amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Paid amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={paidAmount}
            onChangeText={setPaidAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>
        {(sub?.promoCode || sub?.appliedOfferId) && (sub?.promoDiscountAmount ?? 0) > 0 && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Offer applied</Text>
            <Text style={styles.fieldValue}>
              {sub.promoCode ?? sub.appliedOfferId} (-₹{sub.promoDiscountAmount ?? 0})
            </Text>
          </View>
        )}
        {(sub?.walletPaidAmount ?? 0) > 0 && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Paid from wallet</Text>
            <Text style={styles.fieldValue}>₹{sub.walletPaidAmount}</Text>
          </View>
        )}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Remaining deliveries</Text>
          <TextInput
            style={styles.input}
            value={remainingDeliveries}
            onChangeText={setRemainingDeliveries}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Total deliveries</Text>
          <TextInput
            style={styles.input}
            value={totalDeliveries}
            onChangeText={setTotalDeliveries}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Special instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="Optional"
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={3}
          />
        </View>

        <Text style={styles.sectionTitle}>Delivery day logs</Text>
        <Text style={styles.hint}>Each day’s kitchen/delivery status changes are recorded below.</Text>
        {logDates.length === 0 ? (
          <Text style={styles.emptyLogs}>No logs yet.</Text>
        ) : (
          logDates.slice(0, 30).map((dateStr) => (
            <View key={dateStr} style={styles.logCard}>
              <Text style={styles.logDate}>{dateStr}</Text>
              {(deliveryDayLogs[dateStr] ?? []).map((entry, i) => (
                <View key={i} style={styles.logRow}>
                  {entry.type === "kitchen" ? (
                    <ChefHat size={14} color="#F59E0B" />
                  ) : (
                    <Truck size={14} color="#10B981" />
                  )}
                  <Text style={styles.logText}>
                    {entry.type}: {entry.status}
                  </Text>
                  <Text style={styles.logTime}>
                    {entry.at ? new Date(entry.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Check size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showStatusModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowStatusModal(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Status</Text>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.modalOption}
                onPress={() => {
                  setStatus(s);
                  setShowStatusModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{s}</Text>
                {status === s && <Check size={20} color="#10B981" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showWeekTypeModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowWeekTypeModal(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Week type</Text>
            {WEEK_TYPES.map((w) => (
              <TouchableOpacity
                key={w}
                style={styles.modalOption}
                onPress={() => {
                  setWeekType(w);
                  setShowWeekTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{w}</Text>
                {weekType === w && <Check size={20} color="#10B981" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showTimeModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTimeModal(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Delivery time</Text>
            {TIME_SLOTS.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.modalOption}
                onPress={() => {
                  setDeliveryTime(t);
                  setShowTimeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{t}</Text>
                {deliveryTime === t && <Check size={20} color="#10B981" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showMealModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMealModal(false)}>
          <View style={[styles.modalBox, styles.modalBoxTall]} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Meal</Text>
            <FlatList
              data={meals}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setMealId(item.id);
                    setShowMealModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.name}</Text>
                  {mealId === item.id && <Check size={20} color="#10B981" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showPlanModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPlanModal(false)}>
          <View style={[styles.modalBox, styles.modalBoxTall]} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Plan</Text>
            <FlatList
              data={plans}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setPlanId(item.id);
                    setShowPlanModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.name} ({item.days} days)</Text>
                  {planId === item.id && <Check size={20} color="#10B981" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showAddressModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddressModal(false)}>
          <View style={[styles.modalBox, styles.modalBoxTall]} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Address</Text>
            {addresses.length === 0 ? (
              <Text style={styles.modalOptionText}>No addresses</Text>
            ) : (
              addresses.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setAddressId(a.id);
                    setShowAddressModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText} numberOfLines={2}>
                    {a.addressLine}, {a.city}
                  </Text>
                  {addressId === a.id && <Check size={20} color="#10B981" />}
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1220" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#9CA3AF", marginTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hint: { color: "#6B7280", fontSize: 12, marginBottom: 12 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  fieldLabel: { color: "#9CA3AF", fontSize: 14, marginRight: 8 },
  fieldRow: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fieldValue: { color: "#fff", fontSize: 16 },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    padding: 0,
  },
  textArea: { minHeight: 72 },
  logCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  logDate: { color: "#F59E0B", fontWeight: "700", marginBottom: 8 },
  logRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  logText: { color: "#E5E7EB", marginLeft: 8, flex: 1 },
  logTime: { color: "#6B7280", fontSize: 12 },
  emptyLogs: { color: "#6B7280", fontStyle: "italic", marginBottom: 12 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E53935",
    paddingVertical: 17,
    borderRadius: 14,
    marginTop: 24,
    elevation: 4,
    shadowColor: "#E53935",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  saveBtnDisabled: { opacity: 0.6, elevation: 0 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  headerBack: { padding: 8, marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalBoxTall: { maxHeight: "70%" },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  modalOptionText: { color: "#E5E7EB", fontSize: 16 },
});
