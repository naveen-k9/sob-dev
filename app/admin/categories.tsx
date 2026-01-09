import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  ToggleLeft,
  ToggleRight,
  X,
  Image as ImageIcon,
} from "lucide-react-native";
import db from "@/db";
import { Category } from "@/types";

export default function AdminCategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [group, setGroup] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await db.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      Alert.alert("Error", "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.group?.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setImageUrl("");
    setSortOrder("");
    setIsActive(true);
    setGroup("");
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setName(category.name);
    setDescription(category.description);
    setImageUrl(category.image);
    setSortOrder(category.sortOrder?.toString() || "");
    setIsActive(category.isActive);
    setGroup(category.group || "");
    setShowEditModal(true);
  };

  const handleAdd = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      await db.addCategory({
        name: name.trim(),
        description: description.trim(),
        image: imageUrl.trim() || undefined,
        group: group.trim() || undefined,
      });

      Alert.alert("Success", "Category added successfully");
      setShowAddModal(false);
      loadCategories();
    } catch (error) {
      console.error("Error adding category:", error);
      Alert.alert("Error", "Failed to add category");
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !name.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      const sortOrderNum = sortOrder ? parseInt(sortOrder) : undefined;

      await db.updateCategory(selectedCategory.id, {
        name: name.trim(),
        description: description.trim(),
        image: imageUrl.trim() || undefined,
        sortOrder: sortOrderNum,
        isActive,
        group: group.trim() || undefined,
      });

      Alert.alert("Success", "Category updated successfully");
      setShowEditModal(false);
      loadCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      Alert.alert("Error", "Failed to update category");
    }
  };

  const handleDelete = async (categoryId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this category? This may affect meals using this category.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.deleteCategory(categoryId);
              Alert.alert("Success", "Category deleted successfully");
              loadCategories();
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert("Error", "Failed to delete category");
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (categoryId: string) => {
    try {
      await db.toggleCategoryActive(categoryId);
      loadCategories();
    } catch (error) {
      console.error("Error toggling category:", error);
      Alert.alert("Error", "Failed to toggle category status");
    }
  };

  const renderCategoryCard = (category: Category) => {
    return (
      <View key={category.id} style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            {category.group && (
              <Text style={styles.categoryGroup}>Group: {category.group}</Text>
            )}
            <Text style={styles.categoryDescription} numberOfLines={2}>
              {category.description}
            </Text>
          </View>
          <View style={styles.categoryActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleToggleActive(category.id)}
            >
              {category.isActive ? (
                <ToggleRight size={24} color="#10B981" />
              ) : (
                <ToggleLeft size={24} color="#9CA3AF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => openEditModal(category)}
            >
              <Edit size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDelete(category.id)}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.categoryMeta}>
          <Text style={styles.categoryMetaText}>
            Sort Order: {category.sortOrder || "N/A"}
          </Text>
          <View
            style={[
              styles.statusBadge,
              category.isActive ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {category.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderForm = () => (
    <ScrollView style={styles.formContent}>
      <Text style={styles.label}>Category Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., Breakfast, Lunch, High Protein"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter category description"
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Image URL</Text>
      <TextInput
        style={styles.input}
        value={imageUrl}
        onChangeText={setImageUrl}
        placeholder="https://example.com/image.jpg"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Group (Optional)</Text>
      <TextInput
        style={styles.input}
        value={group}
        onChangeText={setGroup}
        placeholder="e.g., Meal Time, Health Goals"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Sort Order</Text>
      <TextInput
        style={styles.input}
        value={sortOrder}
        onChangeText={setSortOrder}
        placeholder="1"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Active</Text>
        <Switch value={isActive} onValueChange={setIsActive} />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories Management</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search categories..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Categories List */}
      <ScrollView style={styles.content}>
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        ) : (
          filteredCategories.map(renderCategoryCard)
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          {renderForm()}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
              <Text style={styles.saveButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Category</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          {renderForm()}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleEdit}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#111827",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categoryCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  categoryGroup: {
    fontSize: 12,
    color: "#8B5CF6",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  categoryActions: {
    flexDirection: "row",
    gap: 4,
  },
  iconButton: {
    padding: 8,
  },
  categoryMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryMetaText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "#D1FAE5",
  },
  inactiveBadge: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  formContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  switchLabel: {
    fontSize: 16,
    color: "#374151",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
