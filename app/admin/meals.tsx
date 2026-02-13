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
  ChefHat,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  Package,
  Eye,
} from "lucide-react-native";
import db from "@/db";
import { Meal, Category, AddOn } from "@/types";

export default function AdminMealsScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "draft"
  >("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [hasEgg, setHasEgg] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [preparationTime, setPreparationTime] = useState("");
  const [tags, setTags] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [allergens, setAllergens] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [isBasicThali, setIsBasicThali] = useState(false);
  const [vegVariantPrice, setVegVariantPrice] = useState("");
  const [nonVegVariantPrice, setNonVegVariantPrice] = useState("");
  const [allowDaySelection, setAllowDaySelection] = useState(false);
  const [availableWeekTypes, setAvailableWeekTypes] = useState<
    ("mon-fri" | "mon-sat" | "everyday")[]
  >([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mealsData, categoriesData, addonsData] = await Promise.all([
        db.getAllMealsAdmin(), // Use admin method to get ALL meals including drafts
        db.getCategories(),
        db.getAddOns(),
      ]);
      setMeals(mealsData);
      setCategories(categoriesData);
      setAddons(addonsData);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredMeals = useMemo(() => {
    let result = meals;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter(
        (m) =>
          m.categoryId === categoryFilter ||
          m.categoryIds?.includes(categoryFilter)
      );
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((m) => m.isActive && !m.isDraft);
    } else if (statusFilter === "inactive") {
      result = result.filter((m) => !m.isActive && !m.isDraft);
    } else if (statusFilter === "draft") {
      result = result.filter((m) => m.isDraft);
    }
    // When "all" is selected, show everything including drafts

    console.log(`[Meals Admin] Status filter: ${statusFilter}`);
    console.log(`[Meals Admin] Total meals: ${meals.length}`);
    console.log(`[Meals Admin] Filtered meals: ${result.length}`);
    console.log(
      `[Meals Admin] Draft meals in all: ${
        meals.filter((m) => m.isDraft).length
      }`
    );

    return result;
  }, [meals, searchQuery, categoryFilter, statusFilter]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setOriginalPrice("");
    setSelectedCategories([]);
    setSelectedAddons([]);
    setImageUrl("");
    setIsVeg(true);
    setHasEgg(false);
    setIsActive(true);
    setIsFeatured(false);
    setIsDraft(false);
    setPreparationTime("");
    setTags("");
    setIngredients("");
    setAllergens("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    setIsBasicThali(false);
    setVegVariantPrice("");
    setNonVegVariantPrice("");
    setAllowDaySelection(false);
    setAvailableWeekTypes([]);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (meal: Meal) => {
    setSelectedMeal(meal);
    setName(meal.name);
    setDescription(meal.description);
    setPrice(meal.price.toString());
    setOriginalPrice(meal.originalPrice?.toString() || "");
    setSelectedCategories(meal.categoryIds || [meal.categoryId] || []);
    setSelectedAddons(meal.addonIds || []);
    setImageUrl(meal.images?.[0] || "");
    setIsVeg(meal.isVeg);
    setHasEgg(meal.hasEgg);
    setIsActive(meal.isActive);
    setIsFeatured(meal.isFeatured);
    setIsDraft(meal.isDraft);
    setPreparationTime(meal.preparationTime?.toString() || "");
    setTags(meal.tags?.join(", ") || "");
    setIngredients(meal.ingredients?.join(", ") || "");
    setAllergens(meal.allergens?.join(", ") || "");
    setCalories(meal.nutritionInfo?.calories?.toString() || "");
    setProtein(meal.nutritionInfo?.protein?.toString() || "");
    setCarbs(meal.nutritionInfo?.carbs?.toString() || "");
    setFat(meal.nutritionInfo?.fat?.toString() || "");
    setFiber(meal.nutritionInfo?.fiber?.toString() || "");
    setIsBasicThali(meal.isBasicThali || false);
    setVegVariantPrice(meal.variantPricing?.veg?.toString() || "");
    setNonVegVariantPrice(meal.variantPricing?.nonveg?.toString() || "");
    setAllowDaySelection(meal.allowDaySelection || false);
    setAvailableWeekTypes(meal.availableWeekTypes ?? []);
    setShowEditModal(true);
  };

  const toggleWeekType = (wt: "mon-fri" | "mon-sat" | "everyday") => {
    setAvailableWeekTypes((prev) =>
      prev.includes(wt) ? prev.filter((x) => x !== wt) : [...prev, wt]
    );
  };

  const handleAdd = async () => {
    if (
      !name.trim() ||
      !description.trim() ||
      !price.trim() ||
      selectedCategories.length === 0
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      const priceNum = parseFloat(price);
      const originalPriceNum = originalPrice
        ? parseFloat(originalPrice)
        : undefined;
      const prepTime = preparationTime ? parseInt(preparationTime) : undefined;

      const nutritionInfo =
        calories || protein || carbs || fat || fiber
          ? {
              calories: calories ? parseInt(calories) : 0,
              protein: protein ? parseFloat(protein) : 0,
              carbs: carbs ? parseFloat(carbs) : 0,
              fat: fat ? parseFloat(fat) : 0,
              fiber: fiber ? parseFloat(fiber) : 0,
            }
          : undefined;

      const variantPricing =
        vegVariantPrice || nonVegVariantPrice
          ? {
              veg: vegVariantPrice ? parseFloat(vegVariantPrice) : priceNum,
              nonveg: nonVegVariantPrice
                ? parseFloat(nonVegVariantPrice)
                : priceNum,
            }
          : undefined;

      await db.addMeal({
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        originalPrice: originalPriceNum,
        categoryId: selectedCategories[0],
        categoryIds: selectedCategories,
        isVeg,
        hasEgg,
        image: imageUrl.trim() || undefined,
        isActive,
        isFeatured,
        isDraft,
        preparationTime: prepTime,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        ingredients: ingredients
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        allergens: allergens
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        nutritionInfo,
        isBasicThali,
        variantPricing,
        allowDaySelection,
        addonIds: selectedAddons.length > 0 ? selectedAddons : undefined,
        availableWeekTypes:
          availableWeekTypes.length > 0 ? availableWeekTypes : undefined,
      });

      Alert.alert("Success", "Meal added successfully");
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error("Error adding meal:", error);
      Alert.alert("Error", "Failed to add meal");
    }
  };

  const handleEdit = async () => {
    if (
      !selectedMeal ||
      !name.trim() ||
      !description.trim() ||
      !price.trim() ||
      selectedCategories.length === 0
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      const priceNum = parseFloat(price);
      const originalPriceNum = originalPrice
        ? parseFloat(originalPrice)
        : undefined;
      const prepTime = preparationTime ? parseInt(preparationTime) : undefined;

      const nutritionInfo =
        calories || protein || carbs || fat || fiber
          ? {
              calories: calories ? parseInt(calories) : 0,
              protein: protein ? parseFloat(protein) : 0,
              carbs: carbs ? parseFloat(carbs) : 0,
              fat: fat ? parseFloat(fat) : 0,
              fiber: fiber ? parseFloat(fiber) : 0,
            }
          : undefined;

      const variantPricing =
        vegVariantPrice || nonVegVariantPrice
          ? {
              veg: vegVariantPrice ? parseFloat(vegVariantPrice) : priceNum,
              nonveg: nonVegVariantPrice
                ? parseFloat(nonVegVariantPrice)
                : priceNum,
            }
          : undefined;

      await db.updateMeal(selectedMeal.id, {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        originalPrice: originalPriceNum,
        categoryId: selectedCategories[0],
        categoryIds: selectedCategories,
        images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
        isVeg,
        hasEgg,
        isActive,
        isFeatured,
        isDraft,
        preparationTime: prepTime,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        ingredients: ingredients
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        allergens: allergens
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        nutritionInfo,
        isBasicThali,
        variantPricing,
        allowDaySelection,
        addonIds: selectedAddons.length > 0 ? selectedAddons : undefined,
        availableWeekTypes:
          availableWeekTypes.length > 0 ? availableWeekTypes : undefined,
      });

      Alert.alert("Success", "Meal updated successfully");
      setShowEditModal(false);
      loadData();
    } catch (error) {
      console.error("Error updating meal:", error);
      Alert.alert("Error", "Failed to update meal");
    }
  };

  const handleSaveAsDraft = async () => {
    if (
      !name.trim() ||
      !description.trim() ||
      !price.trim() ||
      selectedCategories.length === 0
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      const priceNum = parseFloat(price);
      const originalPriceNum = originalPrice
        ? parseFloat(originalPrice)
        : undefined;
      const prepTime = preparationTime ? parseInt(preparationTime) : undefined;

      const nutritionInfo =
        calories || protein || carbs || fat || fiber
          ? {
              calories: calories ? parseInt(calories) : 0,
              protein: protein ? parseFloat(protein) : 0,
              carbs: carbs ? parseFloat(carbs) : 0,
              fat: fat ? parseFloat(fat) : 0,
              fiber: fiber ? parseFloat(fiber) : 0,
            }
          : undefined;

      const variantPricing =
        vegVariantPrice || nonVegVariantPrice
          ? {
              veg: vegVariantPrice ? parseFloat(vegVariantPrice) : priceNum,
              nonveg: nonVegVariantPrice
                ? parseFloat(nonVegVariantPrice)
                : priceNum,
            }
          : undefined;

      await db.addMeal({
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        originalPrice: originalPriceNum,
        categoryId: selectedCategories[0],
        categoryIds: selectedCategories,
        isVeg,
        hasEgg,
        image: imageUrl.trim() || undefined,
        isActive: false,
        isFeatured: false,
        isDraft: true,
        preparationTime: prepTime,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        ingredients: ingredients
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        allergens: allergens
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        nutritionInfo,
        isBasicThali,
        variantPricing,
        allowDaySelection,
        addonIds: selectedAddons.length > 0 ? selectedAddons : undefined,
        availableWeekTypes:
          availableWeekTypes.length > 0 ? availableWeekTypes : undefined,
      });

      Alert.alert("Success", "Meal saved as draft successfully");
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error("Error saving draft:", error);
      Alert.alert("Error", "Failed to save draft");
    }
  };

  const handlePreview = () => {
    if (!name.trim() || !description.trim() || !price.trim()) {
      Alert.alert(
        "Error",
        "Please fill name, description, and price to preview"
      );
      return;
    }

    const priceNum = parseFloat(price);
    const originalPriceNum = originalPrice
      ? parseFloat(originalPrice)
      : undefined;
    const prepTime = preparationTime ? parseInt(preparationTime) : undefined;

    const nutritionInfo =
      calories || protein || carbs || fat || fiber
        ? {
            calories: calories ? parseInt(calories) : 0,
            protein: protein ? parseFloat(protein) : 0,
            carbs: carbs ? parseFloat(carbs) : 0,
            fat: fat ? parseFloat(fat) : 0,
            fiber: fiber ? parseFloat(fiber) : 0,
          }
        : {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
          };

    const variantPricing =
      vegVariantPrice || nonVegVariantPrice
        ? {
            veg: vegVariantPrice ? parseFloat(vegVariantPrice) : priceNum,
            nonveg: nonVegVariantPrice
              ? parseFloat(nonVegVariantPrice)
              : priceNum,
          }
        : undefined;

    const previewMeal: Meal = {
      id: "preview",
      name: name.trim(),
      description: description.trim(),
      images: imageUrl.trim()
        ? [imageUrl.trim()]
        : ["https://via.placeholder.com/400x300?text=No+Image"],
      categoryId: selectedCategories[0] || "",
      categoryIds: selectedCategories,
      price: priceNum,
      originalPrice: originalPriceNum,
      isVeg,
      hasEgg,
      nutritionInfo,
      ingredients: ingredients
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
      allergens: allergens
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      isActive,
      isFeatured,
      isDraft: true,
      rating: 0,
      reviewCount: 0,
      preparationTime: prepTime || 0,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isBasicThali,
      variantPricing,
      allowDaySelection,
      addonIds: selectedAddons.length > 0 ? selectedAddons : undefined,
    };

    setSelectedMeal(previewMeal);
    setShowPreviewModal(true);
  };

  const handlePreviewMeal = (meal: Meal) => {
    // Navigate to the meal detail page for full preview
    router.push(`/meal/${meal.id}`);
  };

  const handleDelete = async (mealId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this meal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const meals = await db.getMeals();
              const filtered = meals.filter((m) => m.id !== mealId);
              await db["setItem"]("meals", filtered);
              Alert.alert("Success", "Meal deleted successfully");
              loadData();
            } catch (error) {
              console.error("Error deleting meal:", error);
              Alert.alert("Error", "Failed to delete meal");
            }
          },
        },
      ]
    );
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleAddonSelection = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const renderMealCard = (meal: Meal) => {
    const category = categories.find((c) => c.id === meal.categoryId);
    const addonCount = meal.addonIds?.length || 0;

    return (
      <View key={meal.id} style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.mealCategory}>
              {category?.name || "Unknown"}
            </Text>
            <Text style={styles.mealPrice}>₹{meal.price}</Text>
          </View>
          <View style={styles.mealActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handlePreviewMeal(meal)}
            >
              <Eye size={20} color={meal.isDraft ? "#D97706" : "#6B7280"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => openEditModal(meal)}
            >
              <Edit size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDelete(meal.id)}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.mealDescription} numberOfLines={2}>
          {meal.description}
        </Text>

        <View style={styles.mealTags}>
          {meal.isVeg && (
            <View style={[styles.tag, styles.vegTag]}>
              <Text style={styles.tagText}>🟢 Veg</Text>
            </View>
          )}
          {meal.hasEgg && (
            <View style={[styles.tag, styles.eggTag]}>
              <Text style={styles.tagText}>🟡 Egg</Text>
            </View>
          )}
          {meal.isFeatured && (
            <View style={[styles.tag, styles.featuredTag]}>
              <Text style={styles.tagText}>⭐ Featured</Text>
            </View>
          )}
          {meal.isDraft && (
            <View style={[styles.tag, styles.draftTag]}>
              <Text style={styles.tagText}>📝 Draft</Text>
            </View>
          )}
          {!meal.isActive && (
            <View style={[styles.tag, styles.inactiveTag]}>
              <Text style={styles.tagText}>❌ Inactive</Text>
            </View>
          )}
          {addonCount > 0 && (
            <View style={[styles.tag, styles.addonTag]}>
              <Text style={styles.tagText}>+ {addonCount} addons</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderForm = () => (
    <ScrollView style={styles.formContent}>
      <Text style={styles.sectionTitle}>Basic Information</Text>

      <Text style={styles.label}>Meal Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter meal name"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter meal description"
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Price * (₹)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="149"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Original Price (₹)</Text>
          <TextInput
            style={styles.input}
            value={originalPrice}
            onChangeText={setOriginalPrice}
            placeholder="199"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.label}>Image URL</Text>
      <TextInput
        style={styles.input}
        value={imageUrl}
        onChangeText={setImageUrl}
        placeholder="https://example.com/image.jpg"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.sectionTitle}>Categories * (Select one or more)</Text>
      <View style={styles.chipContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.chip,
              selectedCategories.includes(cat.id) && styles.chipSelected,
            ]}
            onPress={() => toggleCategorySelection(cat.id)}
          >
            <Text
              style={[
                styles.chipLabel,
                selectedCategories.includes(cat.id) && styles.chipLabelSelected,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Available Add-ons</Text>
      <View style={styles.chipContainer}>
        {addons.map((addon) => (
          <TouchableOpacity
            key={addon.id}
            style={[
              styles.chip,
              selectedAddons.includes(addon.id) && styles.chipSelected,
            ]}
            onPress={() => toggleAddonSelection(addon.id)}
          >
            <Text
              style={[
                styles.chipLabel,
                selectedAddons.includes(addon.id) && styles.chipLabelSelected,
              ]}
            >
              {addon.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Vegetarian</Text>
        <Switch value={isVeg} onValueChange={setIsVeg} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Contains Egg</Text>
        <Switch value={hasEgg} onValueChange={setHasEgg} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Active</Text>
        <Switch value={isActive} onValueChange={setIsActive} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Featured</Text>
        <Switch value={isFeatured} onValueChange={setIsFeatured} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Draft</Text>
        <Switch value={isDraft} onValueChange={setIsDraft} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>
          Basic Thali (Veg/Non-Veg variants)
        </Text>
        <Switch value={isBasicThali} onValueChange={setIsBasicThali} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Allow Day Selection</Text>
        <Switch
          value={allowDaySelection}
          onValueChange={setAllowDaySelection}
        />
      </View>

      <Text style={styles.sectionTitle}>Week Types (optional)</Text>
      <Text style={[styles.label, { marginBottom: 6 }]}>
        Limit which week types this meal offers. Leave all unchecked to offer
        Mon-Fri, Mon-Sat, and Every Day.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(
          [
            ["mon-fri", "Mon-Fri"],
            ["mon-sat", "Mon-Sat"],
            ["everyday", "Every Day"],
          ] as const
        ).map(([value, label]) => {
          const selected = availableWeekTypes.includes(value);
          return (
            <TouchableOpacity
              key={value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleWeekType(value)}
            >
              <Text
                style={[
                  styles.chipLabel,
                  selected && styles.chipLabelSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isBasicThali && (
        <>
          <Text style={styles.sectionTitle}>Variant Pricing</Text>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Veg Price (₹)</Text>
              <TextInput
                style={styles.input}
                value={vegVariantPrice}
                onChangeText={setVegVariantPrice}
                placeholder="199"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Non-Veg Price (₹)</Text>
              <TextInput
                style={styles.input}
                value={nonVegVariantPrice}
                onChangeText={setNonVegVariantPrice}
                placeholder="229"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Additional Details</Text>

      <Text style={styles.label}>Preparation Time (minutes)</Text>
      <TextInput
        style={styles.input}
        value={preparationTime}
        onChangeText={setPreparationTime}
        placeholder="25"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Tags (comma separated)</Text>
      <TextInput
        style={styles.input}
        value={tags}
        onChangeText={setTags}
        placeholder="Healthy, Chef's Choice, Home Style"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Ingredients (comma separated)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={ingredients}
        onChangeText={setIngredients}
        placeholder="Rice, Dal, Curry, Salad"
        placeholderTextColor="#9CA3AF"
        multiline
      />

      <Text style={styles.label}>Allergens (comma separated)</Text>
      <TextInput
        style={styles.input}
        value={allergens}
        onChangeText={setAllergens}
        placeholder="Gluten, Dairy"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.sectionTitle}>Nutrition Information</Text>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Calories</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="450"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Protein (g)</Text>
          <TextInput
            style={styles.input}
            value={protein}
            onChangeText={setProtein}
            placeholder="18"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Carbs (g)</Text>
          <TextInput
            style={styles.input}
            value={carbs}
            onChangeText={setCarbs}
            placeholder="60"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Fat (g)</Text>
          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            placeholder="15"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.label}>Fiber (g)</Text>
      <TextInput
        style={styles.input}
        value={fiber}
        onChangeText={setFiber}
        placeholder="8"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#10B981", "#059669"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meals Management</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search meals..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChips}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              categoryFilter === "all" && styles.filterChipActive,
            ]}
            onPress={() => setCategoryFilter("all")}
          >
            <Text
              style={[
                styles.filterChipText,
                categoryFilter === "all" && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterChip,
                categoryFilter === cat.id && styles.filterChipActive,
              ]}
              onPress={() => setCategoryFilter(cat.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === cat.id && styles.filterChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChips}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === "all" && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter("all")}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === "all" && styles.filterChipTextActive,
              ]}
            >
              All Status
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === "active" && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter("active")}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === "active" && styles.filterChipTextActive,
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === "inactive" && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter("inactive")}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === "inactive" && styles.filterChipTextActive,
              ]}
            >
              Inactive
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === "draft" && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter("draft")}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === "draft" && styles.filterChipTextActive,
              ]}
            >
              Draft
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Meals List */}
      <ScrollView style={styles.content}>
        {filteredMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <ChefHat size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No meals found</Text>
          </View>
        ) : (
          filteredMeals.map(renderMealCard)
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
            <Text style={styles.modalTitle}>Add New Meal</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          {renderForm()}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handlePreview}
            >
              <Eye size={18} color="#6B7280" />
              <Text style={styles.previewButtonText}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.draftButton}
              onPress={handleSaveAsDraft}
            >
              <Text style={styles.draftButtonText}>Save as Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
              <Text style={styles.saveButtonText}>Add Meal</Text>
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
            <Text style={styles.modalTitle}>Edit Meal</Text>
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

      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Preview Meal</Text>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.previewContent}>
            {selectedMeal && (
              <View style={styles.previewCard}>
                {/* Meal Image */}
                <View style={styles.previewImageContainer}>
                  {selectedMeal.images[0] &&
                  selectedMeal.images[0] !==
                    "https://via.placeholder.com/400x300?text=No+Image" ? (
                    <View style={styles.previewImageWrapper}>
                      <Text style={styles.previewImageText}>
                        🖼️ Image Preview
                      </Text>
                      <Text style={styles.previewImageUrl} numberOfLines={1}>
                        {selectedMeal.images[0]}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.previewImagePlaceholder}>
                      <ChefHat size={48} color="#9CA3AF" />
                      <Text style={styles.previewImagePlaceholderText}>
                        No Image
                      </Text>
                    </View>
                  )}
                </View>

                {/* Badges */}
                <View style={styles.previewBadges}>
                  <View
                    style={[
                      styles.previewBadge,
                      {
                        backgroundColor: selectedMeal.isVeg
                          ? "#DCFCE7"
                          : "#FEE2E2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.previewBadgeText,
                        { color: selectedMeal.isVeg ? "#16A34A" : "#DC2626" },
                      ]}
                    >
                      {selectedMeal.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}
                    </Text>
                  </View>
                  {selectedMeal.hasEgg && (
                    <View
                      style={[
                        styles.previewBadge,
                        { backgroundColor: "#FEF3C7" },
                      ]}
                    >
                      <Text
                        style={[styles.previewBadgeText, { color: "#D97706" }]}
                      >
                        🥚 Contains Egg
                      </Text>
                    </View>
                  )}
                  {selectedMeal.isFeatured && (
                    <View
                      style={[
                        styles.previewBadge,
                        { backgroundColor: "#DBEAFE" },
                      ]}
                    >
                      <Text
                        style={[styles.previewBadgeText, { color: "#2563EB" }]}
                      >
                        ⭐ Featured
                      </Text>
                    </View>
                  )}
                  {selectedMeal.isBasicThali && (
                    <View
                      style={[
                        styles.previewBadge,
                        { backgroundColor: "#E9D5FF" },
                      ]}
                    >
                      <Text
                        style={[styles.previewBadgeText, { color: "#9333EA" }]}
                      >
                        🍱 Basic Thali
                      </Text>
                    </View>
                  )}
                </View>

                {/* Meal Name */}
                <Text style={styles.previewMealName}>{selectedMeal.name}</Text>

                {/* Description */}
                <Text style={styles.previewDescription}>
                  {selectedMeal.description}
                </Text>

                {/* Price Section */}
                <View style={styles.previewPriceSection}>
                  <View style={styles.previewPriceRow}>
                    <Text style={styles.previewPrice}>
                      ₹{selectedMeal.price}
                    </Text>
                    {selectedMeal.originalPrice && (
                      <Text style={styles.previewOriginalPrice}>
                        ₹{selectedMeal.originalPrice}
                      </Text>
                    )}
                    {selectedMeal.originalPrice && (
                      <View style={styles.previewDiscountBadge}>
                        <Text style={styles.previewDiscountText}>
                          {Math.round(
                            ((selectedMeal.originalPrice - selectedMeal.price) /
                              selectedMeal.originalPrice) *
                              100
                          )}
                          % OFF
                        </Text>
                      </View>
                    )}
                  </View>
                  {selectedMeal.variantPricing && (
                    <View style={styles.previewVariantPricing}>
                      <Text style={styles.previewVariantText}>
                        Veg: ₹{selectedMeal.variantPricing.veg}
                      </Text>
                      <Text style={styles.previewVariantText}>
                        Non-Veg: ₹{selectedMeal.variantPricing.nonveg}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Categories */}
                {selectedMeal.categoryIds &&
                  selectedMeal.categoryIds.length > 0 && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewSectionTitle}>Categories</Text>
                      <View style={styles.previewChips}>
                        {selectedMeal.categoryIds.map((catId) => {
                          const cat = categories.find((c) => c.id === catId);
                          return cat ? (
                            <View key={catId} style={styles.previewChip}>
                              <Text style={styles.previewChipText}>
                                {cat.name}
                              </Text>
                            </View>
                          ) : null;
                        })}
                      </View>
                    </View>
                  )}

                {/* Tags */}
                {selectedMeal.tags && selectedMeal.tags.length > 0 && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewSectionTitle}>Tags</Text>
                    <View style={styles.previewChips}>
                      {selectedMeal.tags.map((tag, index) => (
                        <View key={index} style={styles.previewChip}>
                          <Text style={styles.previewChipText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Preparation Time */}
                {selectedMeal.preparationTime > 0 && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewSectionTitle}>
                      Preparation Time
                    </Text>
                    <Text style={styles.previewText}>
                      {selectedMeal.preparationTime} minutes
                    </Text>
                  </View>
                )}

                {/* Nutrition Info */}
                {selectedMeal.nutritionInfo && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewSectionTitle}>
                      Nutrition Information
                    </Text>
                    <View style={styles.previewNutritionGrid}>
                      <View style={styles.previewNutritionItem}>
                        <Text style={styles.previewNutritionLabel}>
                          Calories
                        </Text>
                        <Text style={styles.previewNutritionValue}>
                          {selectedMeal.nutritionInfo.calories}
                        </Text>
                      </View>
                      <View style={styles.previewNutritionItem}>
                        <Text style={styles.previewNutritionLabel}>
                          Protein
                        </Text>
                        <Text style={styles.previewNutritionValue}>
                          {selectedMeal.nutritionInfo.protein}g
                        </Text>
                      </View>
                      <View style={styles.previewNutritionItem}>
                        <Text style={styles.previewNutritionLabel}>Carbs</Text>
                        <Text style={styles.previewNutritionValue}>
                          {selectedMeal.nutritionInfo.carbs}g
                        </Text>
                      </View>
                      <View style={styles.previewNutritionItem}>
                        <Text style={styles.previewNutritionLabel}>Fat</Text>
                        <Text style={styles.previewNutritionValue}>
                          {selectedMeal.nutritionInfo.fat}g
                        </Text>
                      </View>
                      <View style={styles.previewNutritionItem}>
                        <Text style={styles.previewNutritionLabel}>Fiber</Text>
                        <Text style={styles.previewNutritionValue}>
                          {selectedMeal.nutritionInfo.fiber}g
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Ingredients */}
                {selectedMeal.ingredients &&
                  selectedMeal.ingredients.length > 0 && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewSectionTitle}>
                        Ingredients
                      </Text>
                      <Text style={styles.previewText}>
                        {selectedMeal.ingredients.join(", ")}
                      </Text>
                    </View>
                  )}

                {/* Allergens */}
                {selectedMeal.allergens &&
                  selectedMeal.allergens.length > 0 && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewSectionTitle}>Allergens</Text>
                      <Text style={styles.previewText}>
                        {selectedMeal.allergens.join(", ")}
                      </Text>
                    </View>
                  )}

                {/* Add-ons */}
                {selectedMeal.addonIds && selectedMeal.addonIds.length > 0 && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewSectionTitle}>
                      Available Add-ons
                    </Text>
                    <View style={styles.previewChips}>
                      {selectedMeal.addonIds.map((addonId) => {
                        const addon = addons.find((a) => a.id === addonId);
                        return addon ? (
                          <View key={addonId} style={styles.previewChip}>
                            <Text style={styles.previewChipText}>
                              {addon.name} - ₹{addon.price}
                            </Text>
                          </View>
                        ) : null;
                      })}
                    </View>
                  </View>
                )}

                {/* Settings */}
                <View style={styles.previewSection}>
                  <Text style={styles.previewSectionTitle}>Settings</Text>
                  <View style={styles.previewSettingsList}>
                    <View style={styles.previewSettingItem}>
                      <Text style={styles.previewSettingLabel}>
                        Allow Day Selection
                      </Text>
                      <Text style={styles.previewSettingValue}>
                        {selectedMeal.allowDaySelection ? "Yes" : "No"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
          <View style={styles.previewFooter}>
            <TouchableOpacity
              style={styles.closePreviewButton}
              onPress={() => setShowPreviewModal(false)}
            >
              <Text style={styles.closePreviewButtonText}>Close Preview</Text>
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
  filtersContainer: {
    backgroundColor: "white",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#111827",
  },
  filterChips: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#10B981",
  },
  filterChipText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "white",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mealCard: {
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
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  mealCategory: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  mealPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  mealActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  mealDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  mealTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
  },
  vegTag: {
    backgroundColor: "#D1FAE5",
  },
  eggTag: {
    backgroundColor: "#FEF3C7",
  },
  featuredTag: {
    backgroundColor: "#FEF3C7",
  },
  draftTag: {
    backgroundColor: "#E5E7EB",
  },
  inactiveTag: {
    backgroundColor: "#FEE2E2",
  },
  addonTag: {
    backgroundColor: "#DBEAFE",
  },
  tagText: {
    fontSize: 12,
    color: "#374151",
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 12,
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipSelected: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  chipLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  chipLabelSelected: {
    color: "white",
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
    backgroundColor: "#10B981",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  draftButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  draftButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D97706",
  },
  previewContent: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  previewCard: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewImageContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImageWrapper: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    alignItems: "center",
  },
  previewImageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  previewImageUrl: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  previewImagePlaceholder: {
    backgroundColor: "#F3F4F6",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImagePlaceholderText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  previewBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  previewBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  previewMealName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 16,
  },
  previewPriceSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  previewPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  previewPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#10B981",
  },
  previewOriginalPrice: {
    fontSize: 18,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  previewDiscountBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewDiscountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },
  previewVariantPricing: {
    flexDirection: "row",
    gap: 16,
  },
  previewVariantText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  previewSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  previewText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  previewChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  previewChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  previewChipText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  previewNutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  previewNutritionItem: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  previewNutritionLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  previewNutritionValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  previewSettingsList: {
    gap: 8,
  },
  previewSettingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  previewSettingLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  previewSettingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  previewFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  closePreviewButton: {
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#10B981",
    alignItems: "center",
  },
  closePreviewButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
