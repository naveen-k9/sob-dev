import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  InteractionManager,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchMeals } from "@/services/firebase";
import { Category, Meal, Offer } from "@/types";
import CategoryCard from "@/components/CategoryCard";
import OfferCard from "@/components/OfferCard";
import OfferDetailModal from "@/components/OfferDetailModal";
import FilterChips from "@/components/FilterChips";
import FilterModal from "@/components/FilterModal";
import { ArrowLeftIcon, FilterIcon, LayoutGrid, Rows } from "lucide-react-native";

import { offers as offersSeed } from "@/constants/data";
import { getColors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import MealCard from "@/components/MealCard";
import MenuOffers from "@/components/MenuOffers";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CategoryBrowserScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const initialCategoryId =
    typeof params.categoryId === "string" ? params.categoryId : null;

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    initialCategoryId
  );
  const [activeCategoryName, setActiveCategoryName] = useState<string>("");
  const [gridCols, setGridCols] = useState<number>(2);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState<boolean>(false);
  const hasInitialized = useRef(false);
  const [filterChips, setFilterChips] = useState<
    { id: string; label: string; selected: boolean }[]
  >([
    { id: "veg", label: "Veg", selected: false },
    { id: "non-veg", label: "Non-Veg", selected: false },
    { id: "featured", label: "Featured", selected: false },
    { id: "under-300", label: "Under ₹300", selected: false },
  ]);
  const [filterSections, setFilterSections] = useState<
    {
      id: string;
      title: string;
      options: { id: string; label: string; selected: boolean }[];
    }[]
  >([
    {
      id: "diet",
      title: "Diet Type",
      options: [
        { id: "veg", label: "Vegetarian", selected: false },
        { id: "non-veg", label: "Non-Vegetarian", selected: false },
        { id: "has-egg", label: "Contains Egg", selected: false },
        { id: "no-egg", label: "Egg Free", selected: false },
      ],
    },
    {
      id: "price",
      title: "Price Range",
      options: [
        { id: "under-150", label: "Under ₹150", selected: false },
        { id: "150-250", label: "₹150–₹250", selected: false },
        { id: "250-400", label: "₹250–₹400", selected: false },
        { id: "above-400", label: "Above ₹400", selected: false },
      ],
    },
    
  
    {
      id: "nutrition",
      title: "Nutrition",
      options: [
        { id: "high-protein", label: "High Protein (>20g)", selected: false },
        { id: "low-calorie", label: "Low Calorie (<400)", selected: false },
        { id: "high-fiber", label: "High Fiber (>5g)", selected: false },
      ],
    },
  ]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retryOnMount: true,
    retry: 3,
  });

  const activeOffers: Offer[] = useMemo(
    () => (offersSeed ?? []).filter((o) => o.isActive),
    []
  );

  const mealsQuery = useQuery({
    queryKey: ["meals"],
    queryFn: fetchMeals,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retryOnMount: true,
    retry: 3,
  });

  // Refetch data if there was an error
  useEffect(() => {
    if (categoriesQuery.isError) {
      console.error("Error loading categories:", categoriesQuery.error);
      categoriesQuery.refetch();
    }
  }, [categoriesQuery.isError]);
  // ...existing code...
  // Move activeCategoryName effect below allCategories declaration

  const isLoading = categoriesQuery.isLoading || mealsQuery.isLoading;
  const isError = categoriesQuery.isError || mealsQuery.isError;
  const error = categoriesQuery.error || mealsQuery.error;

  const categories: Category[] = useMemo(() => {
    const data = categoriesQuery.data;
    if (!data || !Array.isArray(data)) {
      console.warn("Invalid categories data:", data);
      return [];
    }
    return data.filter(
      (c) =>
        c &&
        typeof c.id === "string" &&
        typeof c.name === "string" &&
        c.isActive !== false // Show if isActive is true or undefined
    );
  }, [categoriesQuery.data]);

  const mealTimeCategories = useMemo(
    () => categories.filter((c) => c.group === "meal-time"),
    [categories]
  );

  const collectionCategories = useMemo(
    () => categories.filter((c) => c.group === "collection"),
    [categories]
  );

  const allCategories: Category[] = useMemo(() => {
    // Show both meal-time and collection categories in the menu
    const combined = [...mealTimeCategories, ...collectionCategories];
    const sorted = combined.sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    console.log(
      "[menu] Loaded categories:",
      sorted.length,
      sorted.map((c) => `${c.name} (${c.group})`)
    );
    return sorted;
  }, [mealTimeCategories, collectionCategories]);

  // Auto-select first category if none selected and no URL param
  useEffect(() => {
    if (
      !activeCategoryId &&
      allCategories.length > 0 &&
      !initialCategoryId &&
      !hasInitialized.current
    ) {
      const firstCategory = allCategories[0];
      console.log("[menu] Auto-selecting first category:", firstCategory.name);
      setActiveCategoryId(firstCategory.id);
      hasInitialized.current = true;
    }
  }, [activeCategoryId, allCategories, initialCategoryId]);

  useEffect(() => {
    if (activeCategoryId) {
      const found = allCategories.find((c) => c.id === activeCategoryId);
      setActiveCategoryName(found ? found.name : "");
    } else {
      setActiveCategoryName("");
    }
  }, [activeCategoryId, allCategories]);

  /**
   * Main meal filtering logic
   * Applies category filters, chip filters (quick filters), and advanced modal filters
   */
  const displayedMeals: Meal[] = useMemo(() => {
    const all: Meal[] = mealsQuery.data ?? [];

    // Step 1: Filter out invalid or inactive meals
    let validMeals = all.filter(
      (m) =>
        m &&
        typeof m.id === "string" &&
        typeof m.name === "string" &&
        typeof m.price === "number" &&
        m.isActive !== false &&
        !m.isDraft
    );

    // Step 2: Apply category filter (from horizontal category scroll)
    let list = activeCategoryId
      ? validMeals.filter((m) => {
        // Check both categoryId (legacy) and categoryIds array (multi-category support)
        const ids = [
          ...(m.categoryIds ?? []),
          ...(m.categoryId ? [m.categoryId] : []),
        ];

        // Match if meal belongs to the selected category
        const matches = ids.some((id) => id === activeCategoryId);
        return matches;
      })
      : validMeals; // No category selected = show all valid meals

    // Step 3: Collect all selected filters from advanced filter modal
    const selectedFilters: Record<string, string[]> = {};
    filterSections.forEach((section) => {
      const selected = section.options
        .filter((opt) => opt.selected)
        .map((opt) => opt.id);
      if (selected.length > 0) {
        selectedFilters[section.id] = selected;
      }
    });

    // Step 4: Apply quick filter chips (Veg, Non-Veg, Featured, Under ₹300)
    const chipFilters = new Set(
      filterChips.filter((c) => c.selected).map((c) => c.id)
    );

    if (chipFilters.has("veg")) list = list.filter((m) => m.isVeg === true);
    if (chipFilters.has("non-veg"))
      list = list.filter((m) => m.isVeg === false);
    if (chipFilters.has("featured"))
      list = list.filter((m) => m.isFeatured === true);
    if (chipFilters.has("under-300"))
      list = list.filter((m) => (m.price ?? 0) < 300);

    // Step 5: Apply advanced diet filters from modal (OR logic within diet filters)
    if (selectedFilters.diet) {
      list = list.filter((m) => {
        const filters = selectedFilters.diet;
        let match = false;

        if (filters.includes("veg") && m.isVeg === true) match = true;
        if (filters.includes("non-veg") && m.isVeg === false) match = true;
        if (filters.includes("has-egg") && m.hasEgg === true) match = true;
        if (filters.includes("no-egg") && m.hasEgg === false) match = true;

        return match;
      });
    }

    // Step 6: Apply price range filters (OR logic within price filters)
    if (selectedFilters.price) {
      list = list.filter((m) => {
        const price = m.price ?? 0;
        const filters = selectedFilters.price;

        // Return true if meal matches ANY selected price range
        if (filters.includes("under-150") && price < 150) return true;
        if (filters.includes("150-250") && price >= 150 && price < 250)
          return true;
        if (filters.includes("250-400") && price >= 250 && price < 400)
          return true;
        if (filters.includes("above-400") && price >= 400) return true;

        return false;
      });
    }

    // Step 7: Apply rating filters (minimum rating threshold)
    if (selectedFilters.rating) {
      list = list.filter((m) => {
        const rating = m.rating ?? 0;
        const filters = selectedFilters.rating;

        if (filters.includes("4plus") && rating >= 4) return true;
        if (filters.includes("3plus") && rating >= 3) return true;

        return false;
      });
    }

    // Apply special feature filters
    if (selectedFilters.special) {
      list = list.filter((m) => {
        const filters = selectedFilters.special;
        let match = false;

        if (filters.includes("featured") && m.isFeatured === true) match = true;
        if (filters.includes("quick-prep") && (m.preparationTime ?? 999) < 30)
          match = true;

        return match || filters.length === 0;
      });
    }

    // Apply nutrition filters
    if (selectedFilters.nutrition) {
      list = list.filter((m) => {
        const filters = selectedFilters.nutrition;
        let match = false;

        if (
          filters.includes("high-protein") &&
          (m.nutritionInfo?.protein ?? 0) > 20
        )
          match = true;
        if (
          filters.includes("low-calorie") &&
          (m.nutritionInfo?.calories ?? 999) < 400
        )
          match = true;
        if (filters.includes("high-fiber") && (m.nutritionInfo?.fiber ?? 0) > 5)
          match = true;

        return match || filters.length === 0;
      });
    }

    console.log(
      `[menu] Filtered meals for category ${activeCategoryId}:`,
      list.length,
      "meals"
    );

    // Sort by featured status and then by name
    return list.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [mealsQuery.data, activeCategoryId, filterChips, filterSections]);

  const handleMealPress = useCallback((mealId: string) => {
    router.push(`/meal/${mealId}`);
  }, []);

  const handleAdd = useCallback((mealId: string) => {
    router.push(`/meal/${mealId}`);
  }, []);

  const handleFilterToggle = useCallback((id: string) => {
    setFilterChips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  }, []);

  const handleFilterOptionToggle = useCallback(
    (sectionId: string, optionId: string) => {
      setFilterSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
              ...s,
              options: s.options.map((o) =>
                o.id === optionId ? { ...o, selected: !o.selected } : o
              ),
            }
            : s
        )
      );
    },
    []
  );

  const handleApplyFilters = useCallback(() => {
    // Sync chip filters with modal selections
    setFilterChips((prev) =>
      prev.map((chip) => {
        let selected = false;

        // Check if corresponding filter is selected in modal
        filterSections.forEach((section) => {
          section.options.forEach((option) => {
            if (
              (chip.id === "veg" && option.id === "veg" && option.selected) ||
              (chip.id === "non-veg" &&
                option.id === "non-veg" &&
                option.selected) ||
              (chip.id === "featured" &&
                option.id === "featured" &&
                option.selected) ||
              (chip.id === "under-300" &&
                option.id === "under-150" &&
                option.selected)
            ) {
              selected = true;
            }
          });
        });

        return { ...chip, selected };
      })
    );

    setShowFilterModal(false);
  }, [filterSections]);

  const handleClearFilters = useCallback(() => {
    setFilterChips((prev) => prev.map((c) => ({ ...c, selected: false })));
    setFilterSections((prev) =>
      prev.map((s) => ({
        ...s,
        options: s.options.map((o) => ({ ...o, selected: false })),
      }))
    );
  }, []);

  // Horizontal categories measurements for autoscroll
  const scrollRef = useRef<ScrollView | null>(null);
  const itemLayoutsRef = useRef<Record<string, { x: number; width: number }>>(
    {}
  );
  const screenWidth = Dimensions.get("window").width;

  const scrollToCategory = useCallback(
    (id: string, immediate: boolean = false) => {
      const layout = itemLayoutsRef.current[id];
      if (!layout || !scrollRef.current) {
        console.log("Auto-scroll skipped, missing layout or ref", {
          id,
          hasLayout: !!layout,
          hasRef: !!scrollRef.current,
        });
        return;
      }

      // Center the category in the viewport
      const target = Math.max(0, layout.x - (screenWidth - layout.width) / 2);

      try {
        console.log("Auto-scroll to category", id, layout, {
          target,
          immediate,
        });

        if (immediate) {
          // For immediate scrolls (like on mount), do it without animation first
          scrollRef.current.scrollTo({ x: target, y: 0, animated: false });
        } else {
          // For user interactions, use smooth animation
          scrollRef.current.scrollTo({ x: target, y: 0, animated: true });
        }
      } catch (e) {
        console.log("Scroll error", e);
      }
    },
    [screenWidth]
  );

  const onCategoryLayout = useCallback(
    (id: string, x: number, width: number) => {
      itemLayoutsRef.current[id] = { x, width };
      if (id === activeCategoryId) {
        requestAnimationFrame(() => scrollToCategory(id));
      }
    },
    [activeCategoryId, scrollToCategory]
  );

  useEffect(() => {
    if (activeCategoryId) {
      if (itemLayoutsRef.current[activeCategoryId]) {
        // Use immediate scroll if this is first initialization, smooth otherwise
        const isFirstLoad = !hasInitialized.current;
        scrollToCategory(activeCategoryId, isFirstLoad);
        return;
      }
      const t = setTimeout(() => {
        const isFirstLoad = !hasInitialized.current;
        scrollToCategory(activeCategoryId, isFirstLoad);
      }, 60);
      return () => clearTimeout(t);
    }
  }, [activeCategoryId, scrollToCategory]);

  // Handle URL parameter changes (when navigating from other pages with categoryId)
  // This effect runs only when initialCategoryId or allCategories change
  useEffect(() => {
    if (initialCategoryId && allCategories.length > 0) {
      console.log("[menu] URL param categoryId detected:", initialCategoryId);

      const categoryExists = allCategories.some(
        (c) => c.id === initialCategoryId
      );

      if (categoryExists) {
        console.log(
          "[menu] Setting category from URL param:",
          initialCategoryId
        );
        setActiveCategoryId(initialCategoryId);
        hasInitialized.current = true;

        // Scroll to the category with smooth animation after layout is ready
        setTimeout(() => {
          scrollToCategory(initialCategoryId, false); // Smooth scroll for navigation
        }, 200);
      } else if (!hasInitialized.current) {
        console.warn(
          "[menu] Category from URL param not found:",
          initialCategoryId
        );
        // Fall back to first category if the requested one doesn't exist
        if (allCategories.length > 0) {
          const firstCategory = allCategories[0];
          console.log(
            "[menu] Falling back to first category:",
            firstCategory.name
          );
          setActiveCategoryId(firstCategory.id);
          hasInitialized.current = true;
        }
      }
    }
  }, [initialCategoryId, allCategories, scrollToCategory]);

  const handleOfferPress = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
    setOfferModalVisible(true);
  }, []);

  const handleUseOffer = useCallback((offer: Offer) => {
    console.log("Use offer", offer?.code ?? offer?.promoCode);
    setOfferModalVisible(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Menu",
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: {
            color: colors.primary,
            fontSize: 22,
            fontWeight: "700",
          },
          headerLeft: () => (
            <View style={{ marginLeft: 18, marginRight: 9 }}>
              <TouchableOpacity
                onPress={() => router.push("/")}
                testID="open-filter"
              >
                <ArrowLeftIcon
                  size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ),
          headerRight: () => {
            const activeFilterCount = filterSections.reduce(
              (count, section) =>
                count + section.options.filter((opt) => opt.selected).length,
              0
            );

            return (
              <View style={styles.filtersBar}>
                <Text style={[styles.filtersLabel, { backgroundColor: colors.primary, color: colors.surface }]}>
                  {activeFilterCount > 0 ? `${activeFilterCount}` : ""}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFilterModal(true)}
                  testID="open-filter"
                >


                  <Text style={styles.filterAction}>
                    <FilterIcon color={colors.text} />
                  </Text>
                </TouchableOpacity>

              </View>
            );
          },
        }}
      />

      <View style={[styles.sectionMain, { marginTop: -36 }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          contentContainerStyle={[styles.horizontalContent, { backgroundColor: colors.background }]}
          decelerationRate="fast"
          scrollEventThrottle={16}
          snapToAlignment="center"
          onContentSizeChange={() => {
            if (activeCategoryId) {
              requestAnimationFrame(() => scrollToCategory(activeCategoryId));
            }
          }}
        >
          {allCategories.map((c) => (
            <View
              key={c.id}
              testID={`category-item-${c.id}`}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                console.log("Category item layout", c.id, { x, width });
                onCategoryLayout(c.id, x, width);
              }}
            >
              <CategoryCard
                category={c}
                isActive={c.id === activeCategoryId}
                onPress={() => {
                  // Don't deselect if clicking same category - just keep it selected
                  console.log("[menu] Category clicked:", c.name, c.id);

                  // Update state immediately for instant visual feedback
                  setActiveCategoryId(c.id);

                  // Scroll after interactions complete for smooth animation
                  InteractionManager.runAfterInteractions(() => {
                    requestAnimationFrame(() => scrollToCategory(c.id, false));
                  });
                }}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap} testID="categories-loading">
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : isError ? (
        <View style={styles.loadingWrap} testID="categories-error">
          <Text style={styles.errorText}>
            {error instanceof Error
              ? error.message
              : "Failed to load. Please check your connection."}
          </Text>
          <TouchableOpacity
            onPress={() => {
              categoriesQuery.refetch();
              mealsQuery.refetch();
            }}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !categories.length ? (
        <View style={styles.loadingWrap} testID="categories-empty">
          <Text style={styles.errorText}>No categories found.</Text>
          <TouchableOpacity
            onPress={() => {
              categoriesQuery.refetch();
              mealsQuery.refetch();
            }}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* OFFERS SECTION */}

          {/* <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleSmall}>Offers & Coupons</Text>
            <TouchableOpacity onPress={() => console.log('View all offers')}>
              <Text style={styles.clearText}>View all</Text>
            </TouchableOpacity>
          </View> */}
          {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersRow}>
            {activeOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={{
                  ...offer,
                  discount: offer.discount ?? (offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : offer.discountType === 'cashback' ? `₹${offer.discountValue} Cashback` : `₹${offer.discountValue} OFF`),
                  code: offer.code ?? offer.promoCode,
                  validUntil: offer.validUntil ?? new Date(offer.validTo).toDateString(),
                }}
                onPress={() => handleOfferPress(offer)}
              />
            ))}

          </ScrollView> */}
          <MenuOffers />
          {/* 
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleSmall}>{activeCategoryId ? 'Products' : 'Pick a category'}</Text>
            {activeCategoryId && (
              <TouchableOpacity onPress={() => setActiveCategoryId(null)}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View> */}

          {/* Active Category Name below ScrollView */}
          {activeCategoryName ? (

            <View style={styles.centeredSectionHeader}>
              <View style={[styles.headerLine, { backgroundColor: colors.primary }]} />
              <Text style={[styles.centeredSectionTitle, { color: colors.primary }]}>{activeCategoryName} PRODUCTS</Text>
              <View style={[styles.headerLine, { backgroundColor: colors.primary }]} />

            </View>
          ) : null}

          <View style={styles.mealGrid}>
            <FlatList
              key={`meals-${activeCategoryId}-${gridCols}`}
              data={displayedMeals}
              renderItem={({ item }) => (
                <MealCard
                  meal={item}
                  variant={gridCols === 1 ? "list" : "grid"}
                  columns={gridCols === 1 ? 1 : 2}
                  onPress={() => handleMealPress(item.id)}
                  onTryNow={() => handleAdd(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              numColumns={gridCols}
              columnWrapperStyle={gridCols > 1 ? styles.gridRow : undefined}
              scrollEnabled={false}
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={5}
              removeClippedSubviews={true}
              ListEmptyComponent={
                activeCategoryId ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.empty}>
                      No meals found in this category
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Try selecting a different category or adjusting your
                      filters
                    </Text>
                  </View>
                ) : null
              }
            />
          </View>
        </ScrollView>
      )}

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        sections={filterSections}
        onOptionToggle={handleFilterOptionToggle}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <OfferDetailModal
        visible={offerModalVisible}
        offer={selectedOffer}
        onClose={() => setOfferModalVisible(false)}
        onUseOffer={handleUseOffer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  menuTextWrap: { alignItems: "center", marginTop: 12 },
  menuText: {
    backgroundColor: "#A3D397",
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitleSmall: { fontSize: 16, fontWeight: "700", color: "#333" },
  horizontalScroll: { paddingVertical: 0 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionMain: {
    paddingVertical: 0,
  },
  clearText: { color: "#48479B", fontWeight: "600" },
  mealGrid: { paddingHorizontal: 18, marginTop: 0 },
  gridRow: { justifyContent: "space-between" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  empty: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  filtersBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filtersLabel: { fontSize: 12, fontWeight: "700", marginTop: -18, marginRight: -6, paddingHorizontal: 7, borderRadius: 12 },
  filterAction: { color: "#111", fontWeight: "600" },
  headerIconBtn: { padding: 8 },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: { color: "#666" },
  errorText: { color: "#EF4444", textAlign: "center", marginBottom: 8 },
  retryBtn: {
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: "white", fontWeight: "600" },
  offersRow: { paddingLeft: 20, paddingVertical: 8 },
  horizontalContent: {
    paddingHorizontal: 11,
    backgroundColor: "#fff",
    paddingVertical: 3,
  },
  activeCategoryNameWrap: {
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 18,
  },
  activeCategoryNameText: { fontSize: 16, fontWeight: "700", color: "#000" },
  centeredSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    marginBottom: 20,
    gap: 12,
  },
  centeredSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: 12,
    textTransform: 'uppercase'
  },
  headerLine: {
    flex: 1,
    height: 1,
    opacity: 0.2,
  },
});
