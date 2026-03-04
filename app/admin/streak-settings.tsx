import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Flame, Save } from "lucide-react-native";
import db from "@/db";
import { StreakMilestoneConfig } from "@/types";

const STREAK_LABELS: Record<number, string> = {
  21: "First major Milestone",
  60: "Transformation Zone",
  90: "Elite Member",
  120: "Power Performer",
  180: "Half year Legend",
  270: "270 Day Streak",
  365: "Year Champion",
};

export default function AdminStreakSettingsScreen() {
  const [milestones, setMilestones] = useState<StreakMilestoneConfig[]>([]);
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const config = await db.getStreakMilestonesConfig();
      setMilestones(config);
      const next: Record<number, string> = {};
      config.forEach((m) => {
        next[m.days] = String(m.amount);
      });
      setAmounts(next);
    } catch (e) {
      console.error("load streak config", e);
      Alert.alert("Error", "Failed to load streak settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [load])
  );

  const setAmount = (days: number, value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    setAmounts((prev) => ({ ...prev, [days]: value }));
  };

  const save = async () => {
    const amountsByDay: Partial<Record<number, number>> = {};
    let invalid = false;
    milestones.forEach((m) => {
      const v = amounts[m.days];
      const n = v === "" ? m.amount : parseInt(v, 10);
      if (isNaN(n) || n < 0) invalid = true;
      else amountsByDay[m.days] = n;
    });
    if (invalid) {
      Alert.alert("Invalid", "All amounts must be non-negative numbers.");
      return;
    }
    setSaving(true);
    try {
      await db.updateStreakMilestonesConfig(amountsByDay);
      Alert.alert("Saved", "Streak reward amounts updated.");
      load();
    } catch (e) {
      console.error("save streak config", e);
      Alert.alert("Error", "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <Flame size={24} color="#f59e0b" />
            <Text style={styles.headerTitle}>Streak Rewards</Text>
          </View>
          <TouchableOpacity
            onPress={save}
            disabled={saving || loading}
            style={[styles.saveBtn, (saving || loading) && styles.saveBtnDisabled]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Days are fixed. Edit the reward amount (₹) for each milestone. Amount is credited to the user’s wallet when they complete that many deliveries while maintaining an active subscription.
        </Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#48479B" />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {milestones.map((m) => (
              <View key={m.days} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.dayLabel}>Day {m.days}</Text>
                  <Text style={styles.milestoneLabel}>
                    {STREAK_LABELS[m.days] ?? m.label}
                  </Text>
                </View>
                <View style={styles.amountWrap}>
                  <Text style={styles.rupee}>₹</Text>
                  <TextInput
                    style={styles.input}
                    value={amounts[m.days] ?? ""}
                    onChangeText={(t) => setAmount(m.days, t)}
                    keyboardType="number-pad"
                    placeholder={String(m.amount)}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: { padding: 4 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1f2937" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#48479B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  subtitle: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rowLeft: { flex: 1 },
  dayLabel: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  milestoneLabel: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    minWidth: 90,
  },
  rupee: { fontSize: 16, color: "#6b7280", marginRight: 4 },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: "#1f2937",
  },
});
