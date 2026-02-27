import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Plus, Edit, ToggleLeft, ToggleRight, X } from "lucide-react-native";
import db from "@/db";
import { Offer } from "@/types";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=120&fit=crop";

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminOffersScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    image: DEFAULT_IMAGE,
    promoCode: "",
    code: "",
    discountType: "fixed" as "percentage" | "fixed" | "cashback",
    discountValue: "0",
    minOrderAmount: "",
    maxDiscount: "",
    validFrom: "",
    validTo: "",
    isActive: true,
    usageLimit: "",
    offerType: "discount" as "discount" | "cashback" | "deal",
    benefitType: "amount" as "meal" | "amount" | undefined,
    discount: "",
  });

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await db.getOffers();
      setOffers(list ?? []);
    } catch (e) {
      console.error("loadOffers error", e);
      Alert.alert("Error", "Failed to load offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOffers();
      return () => {};
    }, [loadOffers])
  );

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      image: DEFAULT_IMAGE,
      promoCode: "",
      code: "",
      discountType: "fixed",
      discountValue: "0",
      minOrderAmount: "",
      maxDiscount: "",
      validFrom: "",
      validTo: "",
      isActive: true,
      usageLimit: "",
      offerType: "discount",
      benefitType: "amount",
      discount: "",
    });
    setEditingOffer(null);
  };

  const openCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setForm({
      title: offer.title ?? "",
      description: offer.description ?? "",
      image: offer.image ?? DEFAULT_IMAGE,
      promoCode: offer.promoCode ?? offer.code ?? "",
      code: offer.code ?? offer.promoCode ?? "",
      discountType: offer.discountType ?? "fixed",
      discountValue: String(offer.discountValue ?? 0),
      minOrderAmount: offer.minOrderAmount != null ? String(offer.minOrderAmount) : "",
      maxDiscount: offer.maxDiscount != null ? String(offer.maxDiscount) : "",
      validFrom: offer.validFrom ? (typeof offer.validFrom === "string" ? offer.validFrom : offer.validFrom.toISOString().slice(0, 10)) : "",
      validTo: offer.validTo ? (typeof offer.validTo === "string" ? offer.validTo : offer.validTo.toISOString().slice(0, 10)) : "",
      isActive: offer.isActive ?? true,
      usageLimit: offer.usageLimit != null ? String(offer.usageLimit) : "",
      offerType: offer.offerType ?? "discount",
      benefitType: offer.benefitType ?? "amount",
      discount: offer.discount ?? "",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const code = (form.promoCode || form.code || "").trim().toUpperCase();
    if (!code) {
      Alert.alert("Error", "Promo code is required");
      return;
    }
    if (!form.title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    const discountValue = Number(form.discountValue) || 0;
    const validFrom = form.validFrom ? new Date(form.validFrom) : new Date();
    const validTo = form.validTo ? new Date(form.validTo) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    setSaving(true);
    try {
      if (editingOffer) {
        await db.updateOffer(editingOffer.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          image: form.image.trim() || DEFAULT_IMAGE,
          promoCode: code,
          code: code,
          discountType: form.discountType,
          discountValue,
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          validFrom,
          validTo,
          isActive: form.isActive,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          offerType: form.offerType,
          benefitType: form.benefitType,
          discount: form.discount.trim() || undefined,
        });
        Alert.alert("Success", "Offer updated");
      } else {
        await db.createOffer({
          id: `offer_${Date.now()}`,
          title: form.title.trim(),
          description: form.description.trim(),
          image: form.image.trim() || DEFAULT_IMAGE,
          promoCode: code,
          code: code,
          discountType: form.discountType,
          discountValue,
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          validFrom,
          validTo,
          isActive: form.isActive,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          usedCount: 0,
          offerType: form.offerType,
          benefitType: form.benefitType,
          discount: form.discount.trim() || undefined,
        });
        Alert.alert("Success", "Offer created");
      }
      setModalVisible(false);
      resetForm();
      loadOffers();
    } catch (e) {
      console.error("save offer error", e);
      Alert.alert("Error", "Failed to save offer");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      await db.updateOffer(offer.id, { isActive: !offer.isActive });
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, isActive: !o.isActive } : o))
      );
    } catch (e) {
      console.error("toggle offer error", e);
      Alert.alert("Error", "Failed to update offer");
    }
  };

  const renderItem = ({ item }: { item: Offer }) => {
    const code = item.promoCode ?? item.code ?? item.id;
    const discountLabel = item.discount ?? (item.discountType === "fixed" ? `₹${item.discountValue}` : item.discountType === "percentage" ? `${item.discountValue}%` : "");
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.badgeRow}>
            <TouchableOpacity
              onPress={() => handleToggleActive(item)}
              style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}
            >
              {item.isActive ? <ToggleRight size={18} color="#fff" /> : <ToggleLeft size={18} color="#fff" />}
              <Text style={styles.badgeText}>{item.isActive ? "ON" : "OFF"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
              <Edit size={18} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.cardCode}>Code: {code}</Text>
        <Text style={styles.cardDiscount}>{discountLabel}</Text>
        <Text style={styles.cardMeta}>
          Valid: {formatDate(item.validFrom)} – {formatDate(item.validTo)} · Used: {item.usedCount ?? 0}
          {(item.usageLimit ?? 0) > 0 ? ` / ${item.usageLimit}` : ""}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers & Coupons</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Plus size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No offers yet. Add one to get started.</Text>
          <TouchableOpacity onPress={openCreate} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Add offer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(o) => o.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingOffer ? "Edit offer" : "New offer"}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
                placeholder="e.g. Flat ₹100 OFF"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.label}>Promo code *</Text>
              <TextInput
                style={styles.input}
                value={form.promoCode}
                onChangeText={(t) => setForm((f) => ({ ...f, promoCode: t.toUpperCase(), code: t.toUpperCase() }))}
                placeholder="e.g. SAVE100"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
              />
              <Text style={styles.label}>Discount type</Text>
              <View style={styles.row}>
                {(["fixed", "percentage", "cashback"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setForm((f) => ({ ...f, discountType: t }))}
                    style={[styles.chip, form.discountType === t && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, form.discountType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Discount value</Text>
              <TextInput
                style={styles.input}
                value={form.discountValue}
                onChangeText={(t) => setForm((f) => ({ ...f, discountValue: t }))}
                placeholder="e.g. 100"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              <Text style={styles.label}>Display label (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.discount}
                onChangeText={(t) => setForm((f) => ({ ...f, discount: t }))}
                placeholder="e.g. ₹100 OFF"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.label}>Valid from (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.validFrom}
                onChangeText={(t) => setForm((f) => ({ ...f, validFrom: t }))}
                placeholder="2024-01-01"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.label}>Valid to (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.validTo}
                onChangeText={(t) => setForm((f) => ({ ...f, validTo: t }))}
                placeholder="2025-12-31"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.label}>Min order amount (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.minOrderAmount}
                onChangeText={(t) => setForm((f) => ({ ...f, minOrderAmount: t }))}
                placeholder="e.g. 500"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              <Text style={styles.label}>Usage limit (0 = unlimited)</Text>
              <TextInput
                style={styles.input}
                value={form.usageLimit}
                onChangeText={(t) => setForm((f) => ({ ...f, usageLimit: t }))}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              <View style={styles.row}>
                <Text style={styles.label}>Active</Text>
                <TouchableOpacity
                  onPress={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  style={[styles.badge, form.isActive ? styles.badgeActive : styles.badgeInactive]}
                >
                  <Text style={styles.badgeText}>{form.isActive ? "Yes" : "No"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.primaryBtn, styles.saveBtn]}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937" },
  addBtn: { padding: 4 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyText: { fontSize: 16, color: "#6b7280", marginBottom: 16 },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1f2937", flex: 1 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  badgeActive: { backgroundColor: "#10b981" },
  badgeInactive: { backgroundColor: "#6b7280" },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  editBtn: { padding: 4 },
  cardCode: { fontSize: 13, color: "#6366f1", marginTop: 4, fontWeight: "500" },
  cardDiscount: { fontSize: 14, color: "#374151", marginTop: 2 },
  cardMeta: { fontSize: 12, color: "#9ca3af", marginTop: 6 },
  primaryBtn: { backgroundColor: "#6366f1", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", paddingBottom: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937" },
  formScroll: { padding: 20, maxHeight: 400 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 16, color: "#1f2937" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#f3f4f6" },
  chipActive: { backgroundColor: "#6366f1" },
  chipText: { fontSize: 14, color: "#6b7280" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  saveBtn: { marginHorizontal: 20, marginTop: 8 },
});
