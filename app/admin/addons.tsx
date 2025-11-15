import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Plus,
  ArrowLeft,
  Edit,
  Eye,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Tags,
  IndianRupee,
  Image as ImageIcon,
} from "lucide-react-native";
import ErrorBoundary from "@/components/ErrorBoundary";
import db from "@/db";
import { AddOn } from "@/types";

export default function AdminAddons() {
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [query, setQuery] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selected, setSelected] = useState<AddOn | null>(null);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    price: string;
    category: string;
    imageUrl: string;
    isActive: boolean;
    isVeg: boolean;
  }>({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    isActive: true,
    isVeg: true,
  });

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      isActive: true,
      isVeg: true,
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return addons;
    return addons.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.category?.toLowerCase().includes(q) ?? false) ||
        (a.description?.toLowerCase().includes(q) ?? false)
    );
  }, [addons, query]);

  const onAdd = useCallback(async () => {
    try {
      if (!form.name.trim() || !form.price.trim()) {
        Alert.alert("Error", "Name and price are required");
        return;
      }
      const priceNum = Number(form.price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        Alert.alert("Error", "Enter a valid price");
        return;
      }
      const created = await db.createAddOn({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: priceNum,
        category: (form.category.trim() as any) || undefined,
        image: form.imageUrl.trim() || undefined,
        isActive: form.isActive,
        isVeg: form.isVeg,
      });
      console.log("Adding addon", created);
      const list = await db.getAddOns();
      setAddons(list);
      setShowAddModal(false);
      resetForm();
      Alert.alert("Success", "Addon created");
    } catch (e) {
      console.error("onAdd error", e);
      Alert.alert("Error", "Failed to add addon");
    }
  }, [form, resetForm]);

  const onEdit = useCallback(async () => {
    try {
      if (!selected) return;
      if (!form.name.trim() || !form.price.trim()) {
        Alert.alert("Error", "Name and price are required");
        return;
      }
      const priceNum = Number(form.price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        Alert.alert("Error", "Enter a valid price");
        return;
      }
      const updated = await db.updateAddOn(selected.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: priceNum,
        category: (form.category.trim() as any) || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        isActive: form.isActive,
        isVeg: form.isVeg,
      });
      console.log("Updating addon", updated);
      const list = await db.getAddOns();
      setAddons(list);
      setShowEditModal(false);
      setSelected(null);
      resetForm();
      Alert.alert("Success", "Addon updated");
    } catch (e) {
      console.error("onEdit error", e);
      Alert.alert("Error", "Failed to update addon");
    }
  }, [form, selected, resetForm]);

  const onDelete = useCallback((item: AddOn) => {
    Alert.alert("Delete Addon", `Delete ${item.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("Deleting addon", item.id);
            await db.deleteAddOn(item.id);
            const list = await db.getAddOns();
            setAddons(list);
            Alert.alert("Deleted", "Addon removed");
          } catch (e) {
            console.error("onDelete error", e);
            Alert.alert("Error", "Failed to delete addon");
          }
        },
      },
    ]);
  }, []);

  const onToggleActive = useCallback(async (item: AddOn) => {
    try {
      console.log("Toggling active", item.id);
      const updated = await db.toggleAddOnActive(item.id);
      const list = await db.getAddOns();
      setAddons(list);
    } catch (e) {
      console.error("onToggleActive error", e);
      Alert.alert("Error", "Failed to update status");
    }
  }, []);

  const openEdit = useCallback((item: AddOn) => {
    setSelected(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category: item.category ?? "",
      imageUrl: item.image ?? "",
      isActive: item.isActive ?? true,
      isVeg: item.isVeg ?? true,
    });
    setShowEditModal(true);
  }, []);

  const openView = useCallback((item: AddOn) => {
    setSelected(item);
    setShowViewModal(true);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AddOn }) => (
      <View style={styles.card} testID={`addon-card-${item.id}`}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.avatar}>
              <Tags size={18} color="#6B7280" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.category ?? "Uncategorized"} • ₹{item.price}
              </Text>
            </View>
            <View style={styles.badges}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: item.isActive ? "#10B981" : "#6B7280" },
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: item.isVeg ?? true ? "#22C55E" : "#EF4444",
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.isVeg ?? true ? "Veg" : "Non-Veg"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#48479B" }]}
            onPress={() => openView(item)}
            testID={`view-${item.id}`}
          >
            <Eye size={16} color="#fff" />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#F59E0B" }]}
            onPress={() => openEdit(item)}
            testID={`edit-${item.id}`}
          >
            <Edit size={16} color="#fff" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: item.isActive ? "#EF4444" : "#10B981" },
            ]}
            onPress={() => onToggleActive(item)}
            testID={`toggle-${item.id}`}
          >
            {item.isActive ? (
              <ToggleRight size={16} color="#fff" />
            ) : (
              <ToggleLeft size={16} color="#fff" />
            )}
            <Text style={styles.actionText}>
              {item.isActive ? "Deactivate" : "Activate"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#EF4444" }]}
            onPress={() => onDelete(item)}
            testID={`delete-${item.id}`}
          >
            <Trash2 size={16} color="#fff" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [onDelete, onToggleActive, openEdit, openView]
  );

  const keyExtractor = useCallback((item: AddOn) => item.id, []);

  const renderFormModal = (isEdit: boolean) => {
    const isVisible = isEdit ? showEditModal : showAddModal;
    const title = isEdit ? "Edit Addon" : "Add Addon";
    const onClose = () => {
      if (isEdit) setShowEditModal(false);
      else setShowAddModal(false);
      if (!isEdit) resetForm();
      if (isEdit) setSelected(null);
    };
    const onSubmit = isEdit ? onEdit : onAdd;

    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.sheetClose}
              onPress={onClose}
              testID={`close-${isEdit ? "edit" : "add"}`}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(t) => setForm((prev) => ({ ...prev, name: t }))}
                placeholder="e.g., Extra Cheese"
                placeholderTextColor="#9CA3AF"
                testID="input-name"
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.field, styles.flex1]}>
                <Text style={styles.label}>Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={form.price}
                  onChangeText={(t) =>
                    setForm((prev) => ({
                      ...prev,
                      price: t.replace(/[^0-9.]/g, ""),
                    }))
                  }
                  keyboardType={
                    Platform.select({
                      web: "decimal",
                      default: "numeric",
                    }) as any
                  }
                  placeholder="49"
                  placeholderTextColor="#9CA3AF"
                  testID="input-price"
                />
              </View>
              <View style={[styles.field, styles.flex1, styles.ml12]}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={form.category}
                  onChangeText={(t) =>
                    setForm((prev) => ({ ...prev, category: t }))
                  }
                  placeholder="Protein / Sides / Breads"
                  placeholderTextColor="#9CA3AF"
                  testID="input-category"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Image URL</Text>
              <TextInput
                style={styles.input}
                value={form.imageUrl}
                onChangeText={(t) =>
                  setForm((prev) => ({ ...prev, imageUrl: t }))
                }
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                testID="input-image"
              />
              <View style={styles.hintRow}>
                <ImageIcon size={16} color="#6B7280" />
                <Text style={styles.hint}>Paste an image URL (optional)</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  { height: 100, textAlignVertical: "top" },
                ]}
                value={form.description}
                onChangeText={(t) =>
                  setForm((prev) => ({ ...prev, description: t }))
                }
                placeholder="Short description"
                placeholderTextColor="#9CA3AF"
                multiline
                testID="input-desc"
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Active</Text>
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() =>
                  setForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
                testID="toggle-active"
              >
                {form.isActive ? (
                  <ToggleRight size={24} color="#10B981" />
                ) : (
                  <ToggleLeft size={24} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onSubmit}
              testID={`submit-${isEdit ? "edit" : "add"}`}
            >
              <Text style={styles.primaryBtnText}>
                {isEdit ? "Update Addon" : "Create Addon"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const list = await db.getAddOns();
        setAddons(list);
      } catch (e) {
        console.log("Failed to load addons", e);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ErrorBoundary>
        <LinearGradient colors={["#1F2937", "#111827"]} style={styles.gradient}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.back()}
              testID="back-btn"
            >
              <ArrowLeft size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Addons Management</Text>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: "#10B981" }]}
              onPress={() => {
                setShowAddModal(true);
                resetForm();
              }}
              testID="add-btn"
            >
              <Plus size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search addons by name, category, description"
              placeholderTextColor="#9CA3AF"
              testID="search"
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{addons.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {addons.filter((a) => a.isActive).length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                ₹{addons.reduce((s, a) => s + a.price, 0)}
              </Text>
              <Text style={styles.statLabel}>Sum Price</Text>
            </View>
            <View style={styles.stat}>
              <IndianRupee size={18} color="#9CA3AF" />
              <Text style={[styles.statLabel, styles.mt4]}>INR</Text>
            </View>
          </View>

          <View style={styles.listWrap}>
            <Text style={styles.sectionTitle}>
              All Addons ({filtered.length})
            </Text>
            {filtered.length > 0 ? (
              <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                testID="addons-list"
              />
            ) : (
              <View style={styles.empty}>
                <Tags size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Addons Found</Text>
                <Text style={styles.emptyDesc}>
                  Try adjusting your search or create a new addon.
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {renderFormModal(false)}
        {renderFormModal(true)}

        <Modal
          visible={showViewModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Addon Details</Text>
              <TouchableOpacity
                style={styles.sheetClose}
                onPress={() => {
                  setShowViewModal(false);
                  setSelected(null);
                }}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.flex1} contentContainerStyle={styles.p20}>
              {selected && (
                <View>
                  <View style={styles.viewBlock}>
                    <Text style={styles.viewLabel}>Name</Text>
                    <Text style={styles.viewValue}>{selected.name}</Text>
                  </View>
                  <View style={styles.viewBlock}>
                    <Text style={styles.viewLabel}>Price</Text>
                    <Text style={styles.viewValue}>₹{selected.price}</Text>
                  </View>
                  {selected.category ? (
                    <View style={styles.viewBlock}>
                      <Text style={styles.viewLabel}>Category</Text>
                      <Text style={styles.viewValue}>{selected.category}</Text>
                    </View>
                  ) : null}
                  {selected.description ? (
                    <View style={styles.viewBlock}>
                      <Text style={styles.viewLabel}>Description</Text>
                      <Text style={styles.viewDesc}>
                        {selected.description}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.viewInline}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            selected.isActive ?? true ? "#10B981" : "#6B7280",
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {selected.isActive ?? true ? "Active" : "Inactive"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            selected.isVeg ?? true ? "#22C55E" : "#EF4444",
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {selected.isVeg ?? true ? "Veg" : "Non-Veg"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.viewActionsWrap}>
                    <TouchableOpacity
                      style={[
                        styles.viewAction,
                        { backgroundColor: "#F59E0B" },
                      ]}
                      onPress={() => {
                        setShowViewModal(false);
                        if (selected) openEdit(selected);
                      }}
                    >
                      <Edit size={18} color="#fff" />
                      <Text style={styles.viewActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.viewAction,
                        {
                          backgroundColor:
                            selected.isActive ?? true ? "#EF4444" : "#10B981",
                        },
                      ]}
                      onPress={() => {
                        if (selected) onToggleActive(selected);
                        setShowViewModal(false);
                      }}
                    >
                      {selected.isActive ?? true ? (
                        <ToggleRight size={18} color="#fff" />
                      ) : (
                        <ToggleLeft size={18} color="#fff" />
                      )}
                      <Text style={styles.viewActionText}>
                        {selected.isActive ?? true ? "Deactivate" : "Activate"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ErrorBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  flex1: { flex: 1 },
  p20: { padding: 20 },
  listWrap: { flex: 1, paddingHorizontal: 20 },
  listContent: { paddingBottom: 24 },
  viewActionsWrap: { marginTop: 16, gap: 12 },
  viewContainer: {},
  mt4: { marginTop: 4 },
  ml12: { marginLeft: 12 },
  closeText: { fontSize: 16, color: "#111827" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  searchBar: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { marginLeft: 8, color: "#fff", flex: 1, fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statValue: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
  },
  statLabel: { color: "#9CA3AF", fontSize: 12 },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 12,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardHeader: { marginBottom: 8 },
  cardTitleRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cardMeta: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  badges: { flexDirection: "row", gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  desc: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 64 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 12 },
  emptyDesc: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  sheet: { flex: 1, backgroundColor: "#F9FAFB" },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sheetTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  sheetClose: { padding: 8, backgroundColor: "#F3F4F6", borderRadius: 8 },
  field: { marginBottom: 16 },
  fieldRow: { flexDirection: "row" },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  hint: { color: "#6B7280", fontSize: 12 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 8,
  },
  toggleLabel: { fontSize: 16, fontWeight: "500", color: "#374151" },
  toggleBtn: { padding: 4 },
  primaryBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 20,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  viewBlock: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  viewLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 6,
  },
  viewValue: { fontSize: 16, color: "#111827", fontWeight: "500" },
  viewDesc: { fontSize: 16, color: "#111827", lineHeight: 22 },
  viewInline: { flexDirection: "row", gap: 8, marginTop: 8 },
  viewAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  viewActionText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
