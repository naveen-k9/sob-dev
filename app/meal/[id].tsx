import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Switch,
  Platform,
  Animated,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Heart,
  Share,
  Plus,
  Minus,
  Star,
  Calendar,
  Clock,
  X,
  ChevronRight,
  ChefHat,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Meal, AddOn, SubscriptionPlan, TimeSlot } from "@/types";
import db from "@/db";
import { addOns, subscriptionPlans } from "@/constants/data";
import { consumeMealOpenInTrialMode } from "@/lib/mealNavigationIntent";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import AddOnsModal from "@/components/AddOnsModal";
import { Colors } from "@/constants/colors";
const TOP_BG_HEIGHT = Math.round(Dimensions.get("window").height * 0.36);
type WeekType = "mon-fri" | "mon-sat" | "everyday";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

function getParamString(value: string | string[] | undefined): string | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function MealDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; mode?: string; planId?: string }>();
  const id = getParamString(params.id) ?? undefined;
  const mode = getParamString(params.mode) ?? undefined;
  const planId = getParamString(params.planId) ?? undefined;

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [showAddOnsDrawer, setShowAddOnsDrawer] = useState(false);
  // Default to 6-day plan for dynamic plans
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const openInTrialIntentRef = useRef(consumeMealOpenInTrialMode());
  const [isTrialMode, setIsTrialMode] = useState(() => mode === "trial" || openInTrialIntentRef.current);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const routerInstance = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const [weekType, setWeekType] = useState<WeekType>("mon-fri");

  // Default weekType from meal's first available, or mon-fri
  const weekTypeOptions: { value: WeekType; label: string }[] = useMemo(() => {
    const all: { value: WeekType; label: string }[] = [
      ["mon-fri", "Mon-Fri"],
      ["mon-sat", "Mon-Sat"],
      ["everyday", "Every Day"],
    ].map(([v, l]) => ({ value: v as WeekType, label: l }));
    if (meal?.availableWeekTypes && meal.availableWeekTypes.length > 0) {
      return all.filter((o) => meal.availableWeekTypes!.includes(o.value));
    }
    return all;
  }, [meal?.availableWeekTypes]);

  useEffect(() => {
    if (meal?.availableWeekTypes?.length && !meal.availableWeekTypes.includes(weekType)) {
      setWeekType(meal.availableWeekTypes[0]);
    }
  }, [meal?.availableWeekTypes, weekType]);

  const [selectedAddOnDays, setSelectedAddOnDays] = useState<
    Record<string, DayKey[]>
  >({});
  const [thaliDayMap, setThaliDayMap] = useState<
    Record<DayKey, "veg" | "nonveg">
  >({} as Record<DayKey, "veg" | "nonveg">);
  const [productDays, setProductDays] = useState<DayKey[]>([]);

  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);

  const [barStyle, setBarStyle] = useState<"light" | "dark">("light");
  const [showHeader, setShowHeader] = useState(false);
  const headerOpacity = useState(new Animated.Value(0))[0];

  const onScrollStatusChange = (style: "light" | "dark") => {
    setBarStyle(style);
  };
  React.useEffect(() => {
    setCanGoBack(routerInstance.canGoBack());
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const slots = await db.getTimeSlots();
        const active = (slots || []).filter((s) => s.isActive !== false);
        setAllTimeSlots(active);
        if (typeof id === "string") {
          const mealData = await db.getMealById(id);
          if (mealData) {
            setMeal(mealData);
            const ids =
              mealData.availableTimeSlotIds &&
              mealData.availableTimeSlotIds.length > 0
                ? mealData.availableTimeSlotIds
                : active.map((s) => s.id);
            const first =
              active.find((s) => ids.includes(s.id)) ?? active[0] ?? null;
            setSelectedTimeSlot(first ?? null);

            const fromTrialButton = openInTrialIntentRef.current;
            if (fromTrialButton) {
              openInTrialIntentRef.current = false;
              setIsTrialMode(true);
              setSelectedPlan({
                id: "dynamic-2",
                name: "2 Day Plan",
                duration: 2,
                originalPrice: mealData.price * 2,
                discountedPrice: mealData.price * 2,
                discount: 0,
                mealsPerDay: 1,
                description: "Meal price x 2 days",
                features: ["2 Days", "1 Meal/Day", "Free Delivery"],
                popular: false,
              });
            } else {
              const urlMode = typeof mode === "string" ? mode : null;
              if (urlMode === "trial") {
                setIsTrialMode(true);
                setSelectedPlan({
                  id: "dynamic-2",
                  name: "2 Day Plan",
                  duration: 2,
                  originalPrice: mealData.price * 2,
                  discountedPrice: mealData.price * 2,
                  discount: 0,
                  mealsPerDay: 1,
                  description: "Meal price x 2 days",
                  features: ["2 Days", "1 Meal/Day", "Free Delivery"],
                  popular: false,
                });
              } else if (urlMode === "subscribe") {
                setIsTrialMode(false);
                const planIdStr = typeof planId === "string" ? planId : "6";
                const duration = parseInt(planIdStr, 10) || 6;
                setSelectedPlan({
                  id: `dynamic-${duration}`,
                  name: `${duration} Day Plan`,
                  duration,
                  originalPrice: mealData.price * duration,
                  discountedPrice: mealData.price * duration,
                  discount: 0,
                  mealsPerDay: 1,
                  description: `Meal price x ${duration} days`,
                  features: [`${duration} Days`, "1 Meal/Day", "Free Delivery"],
                  popular: duration === 6 || duration === 15,
                });
              } else {
                setSelectedPlan({
                  id: "dynamic-6",
                  name: "6 Day Plan",
                  duration: 6,
                  originalPrice: mealData.price * 6,
                  discountedPrice: mealData.price * 6,
                  discount: 0,
                  mealsPerDay: 1,
                  description: "Meal price x 6 days",
                  features: ["6 Days", "1 Meal/Day", "Free Delivery"],
                  popular: true,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading meal or timeslots:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, mode, planId]);

  // Update selected plan when trial mode changes (only when meal is loaded)
  useEffect(() => {
    if (!meal) return;
    const availablePlans = getAvailablePlans();
    if (availablePlans.length === 0) return;
    if (isTrialMode) {
      const twoDay = availablePlans.find((p) => p.duration === 2) ?? availablePlans[0];
      setSelectedPlan(twoDay);
    } else {
      const sixDay = availablePlans.find((p) => p.duration === 6) ?? availablePlans[0];
      setSelectedPlan(sixDay);
    }
  }, [isTrialMode, meal]);

  // Sync trial mode from URL params (e.g. when navigating from 2-Day Trial button)
  useEffect(() => {
    if (mode === "trial") {
      setIsTrialMode(true);
    } else if (mode === "subscribe") {
      setIsTrialMode(false);
    }
  }, [mode]);

  // Dynamic pricing plans based on meal price
  const dynamicPlanDurations = [2, 6, 15, 26];
  const getAvailablePlans = useCallback(() => {
    if (!meal) return [];
    // Build plans dynamically
    const plans = dynamicPlanDurations.map((duration, idx) => ({
      id: `dynamic-${duration}`,
      name: `${duration} Day Plan`,
      duration,
      originalPrice: meal.price * duration,
      discountedPrice: meal.price * duration, // No discount logic for now
      discount: 0,
      mealsPerDay: 1,
      description: `Meal price x ${duration} days`,
      features: [`${duration} Days`, "1 Meal/Day", "Free Delivery"],
      popular: duration === 6 || duration === 15,
    }));
    // Show all plans regardless of trial mode
    return plans;
  }, [meal]);

  // When opened via 2-Day Trial (mode=trial), ensure 2-day plan is selected and trial mode is on
  useEffect(() => {
    if (!meal || mode !== "trial") return;
    const plans = getAvailablePlans();
    const twoDay = plans.find((p) => p.duration === 2) ?? plans[0];
    if (twoDay) {
      setIsTrialMode(true);
      setSelectedPlan(twoDay);
    }
  }, [meal, mode, getAvailablePlans]);

  const handleAddOnToggle = useCallback(
    (addOnId: string) => {
      setSelectedAddOns((prev) => {
        const exists = prev.includes(addOnId);
        const next = exists ? prev.filter((id) => id !== addOnId) : [...prev, addOnId];
        if (exists) {
          // If removing the add-on, also remove its selected days to avoid stale state
          setSelectedAddOnDays((d) => {
            const copy = { ...d };
            delete copy[addOnId];
            return copy;
          });
        } else {
          // When adding an add-on, default to selecting the first available day only
          // (previously an empty array was treated as "all days"). Use the current
          // availableDays ordering so trial mode will set Day 1 by default.
          const defaultFirstDay: DayKey = "mon";
          setSelectedAddOnDays((d) => ({
            ...d,
            [addOnId]: d[addOnId] && d[addOnId].length > 0 ? d[addOnId] : [defaultFirstDay],
          }));
        }
        return next;
      });
    }, []
  );

  const availableDays: { key: DayKey; label: string; short: string }[] =
    useMemo(() => {
      const base: { key: DayKey; label: string; short: string }[] = [
        { key: "mon", label: "Monday", short: "M" },
        { key: "tue", label: "Tuesday", short: "T" },
        { key: "wed", label: "Wednesday", short: "W" },
        { key: "thu", label: "Thursday", short: "T" },
        { key: "fri", label: "Friday", short: "F" },
        { key: "sat", label: "Saturday", short: "S" },
        { key: "sun", label: "Sunday", short: "S" },
      ];
      if (weekType === "mon-fri") return base.slice(0, 5);
      if (weekType === "mon-sat") return base.slice(0, 6);
      return base; // everyday: all 7
    }, [weekType]);

  useEffect(() => {
    if (availableDays.length > 0) {
      setThaliDayMap((prev) => {
        const next: Record<DayKey, "veg" | "nonveg"> = { ...prev } as Record<
          DayKey,
          "veg" | "nonveg"
        >;
        availableDays.forEach((d, idx) => {
          if (!next[d.key]) {
            next[d.key] = idx % 2 === 0 ? "veg" : "nonveg";
          }
        });
        // Remove days not in availableDays
        const allowedKeys = availableDays.map((d) => d.key);
        (Object.keys(next) as DayKey[]).forEach((k) => {
          if (!allowedKeys.includes(k)) delete next[k];
        });
        return { ...next };
      });
      setProductDays((prev) =>
        prev.filter((d) => availableDays.some((ad) => ad.key === d))
      );
    }
  }, [availableDays.length]);

  // Sanitize selectedAddOnDays whenever availableDays changes (e.g. trial mode toggle)
  useEffect(() => {
    if (availableDays.length === 0) return;
    const allowedKeys = availableDays.map((d) => d.key);
    setSelectedAddOnDays((prev) => {
      const next: Record<string, DayKey[]> = { ...prev };
      Object.keys(next).forEach((addOnId) => {
        const prevArr = next[addOnId] ?? [];
        // If previously explicitly empty (meaning 'all days'), default to first available day
        if (prevArr.length === 0) {
          next[addOnId] = [allowedKeys[0]];
        } else {
          const filtered = prevArr.filter((k) => allowedKeys.includes(k));
          next[addOnId] = filtered.length > 0 ? filtered : [allowedKeys[0]];
        }
      });
      return next;
    });
  }, [availableDays]);

  const toggleAddOnDay = useCallback((addOnId: string, day: DayKey) => {
    setSelectedAddOnDays((prev) => {
      const current = prev[addOnId] ?? [];
      const has = current.includes(day);
      const next = has ? current.filter((d) => d !== day) : [...current, day];
      // If user removed all selected days, remove the addon from selection
      if (next.length === 0) {
        setSelectedAddOns((ids) => ids.filter((id) => id !== addOnId));
        const copy = { ...prev };
        delete copy[addOnId];
        return copy;
      }
      return { ...prev, [addOnId]: next };
    });
  }, []);

  const filteredAddOns: AddOn[] = useMemo(() => {
    // Filter by meal's addonIds if specified
    if (meal?.addonIds && meal.addonIds.length > 0) {
      return addOns.filter((a) => meal.addonIds!.includes(a.id));
    }
    // Show all addons if no specific addons are defined for the meal
    return addOns;
  }, [meal]);

  const variantPrice = useMemo<number>(() => {
    if (!meal) return 0;
    return meal.price ?? 0;
  }, [meal]);

  const calculateTotalPrice = () => {
    if (!meal || !selectedPlan) return 0;
    const daysPerWeek = isTrialMode
      ? 2
      : weekType === "everyday"
        ? 7
        : weekType === "mon-fri"
          ? 5
          : 6;
    const weeks = Math.ceil(selectedPlan.duration / daysPerWeek);

    // Base price is always plan duration × meal price
    // Day selection only affects WHICH days to deliver, not the total count
    let basePrice = selectedPlan.discountedPrice;

    // If trial, use dynamic trial price (meal.price * 2)
    if (isTrialMode && meal) {
      basePrice = meal.price * 2;
    }

    const addOnTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOns.find((a) => a.id === addOnId);
      if (!addOn) return total;
      const selectedDaysCount = selectedAddOnDays[addOnId]?.length ?? 0;
      const totalDaysForAddon =
        selectedDaysCount === 0
          ? selectedPlan.duration
          : Math.min(selectedPlan.duration, weeks * selectedDaysCount);
      return total + addOn.price * totalDaysForAddon;
    }, 0);

    return basePrice + addOnTotal;
  };

  const handleProceed = () => {
    if (!meal) return;

    const subscriptionData = {
      meal,
      plan: selectedPlan,
      addOns: selectedAddOns,
      timeSlot: selectedTimeSlot ?? undefined,
      weekType,
      startDate,
      isTrialMode,
      totalPrice: calculateTotalPrice(),
    };

    router.push({
      pathname: "/checkout",
      params: { subscriptionData: JSON.stringify(subscriptionData) },
    });
  };

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!meal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Meal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container]}>
      {/* Custom Animated Header */}
      <Animated.View
        style={[
          styles.customHeader,
          {
            opacity: headerOpacity,
            transform: [
              {
                translateY: headerOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={showHeader ? "auto" : "none"}
      >
        <View style={styles.customHeaderContent}>
          <TouchableOpacity
            style={styles.customHeaderButton}
            onPress={() => {
              if (canGoBack) {
                router.back();
              } else {
                router.replace("/(tabs)");
              }
            }}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.customHeaderTitle} numberOfLines={1}>
            {meal.name}
          </Text>

          {/* <TouchableOpacity style={styles.customHeaderButton}>
            <Share size={24} color="#333" />
          </TouchableOpacity> */}
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset?.y ?? 0;
          const threshold = TOP_BG_HEIGHT * 0.7;
          const shouldShow = y > threshold;

          if (shouldShow !== showHeader) {
            setShowHeader(shouldShow);
            Animated.spring(headerOpacity, {
              toValue: shouldShow ? 1 : 0,
              useNativeDriver: true,
              tension: 100,
              friction: 10,
            }).start();
          }
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.imageContainer}>
          {/* Custom header overlay on top of image */}
          <View
            style={{
              position: "absolute",
              top: 18,
              left: 0,
              right: 0,
              zIndex: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                if (canGoBack) {
                  router.back();
                } else {
                  router.replace("/(tabs)");
                }
              }}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              {/* <TouchableOpacity style={styles.headerButton}>
                <Share size={24} color="white" />
              </TouchableOpacity> */}
            </View>
          </View>
          <Image source={{ uri: meal.images[0] }} style={styles.mealImage} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.imageOverlay}
          />
        </View> 

        <View style={styles.content}>
          <View style={styles.basicInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.mealName}>{meal.name}</Text>
              {/* <View style={styles.ratingContainer}>
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <Text style={styles.rating}>{meal.rating}</Text>
                <Text style={styles.reviewCount}>({meal.reviewCount})</Text>
              </View> */}
            </View>

            <Text style={styles.description}>{meal.description}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{variantPrice}</Text>
              {meal.originalPrice && (
                <Text style={styles.originalPrice}>₹{meal.originalPrice}</Text>
              )}
              {/* <View style={styles.tags}>
                {meal.isVeg && <Text style={styles.vegTag}>🟢 VEG</Text>}
                {meal.hasEgg && <Text style={styles.eggTag}>🟡 EGG</Text>}
                {!meal.isVeg && !meal.hasEgg && <Text style={styles.nonVegTag}>🔴 NON-VEG</Text>}
              </View> */}
            </View>
            {meal.variantPricing && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <View style={styles.variantPill}>
                  <Text style={styles.variantPillText}>
                    Veg ₹{meal.variantPricing.veg ?? meal.price}
                  </Text>
                </View>
                <View style={styles.variantPill}>
                  <Text style={styles.variantPillText}>
                    Non-Veg ₹
                    {meal.variantPricing.nonveg ??
                      meal.variantPricing.veg ??
                      meal.price}
                  </Text>
                </View>
              </View>
            )}
          </View>

          
           {/* Ingredients */}
           <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.ingredients}>
              {meal.ingredients.join(", ")}
            </Text>
          </View>

          {/* Week Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Week Type</Text>
            <View style={styles.weekTypeRow}>
              {weekTypeOptions.map(({ value: val, label }) => {
                const isSelected = weekType === val;
                return (
                  <TouchableOpacity
                    key={val}
                    testID={`week-type-${val}`}
                    style={[
                      styles.weekTypeButton,
                      isSelected && styles.weekTypeSelected,
                    ]}
                    onPress={() => setWeekType(val)}
                  >
                    <Text
                      style={[
                        styles.weekTypeText,
                        isSelected && styles.weekTypeTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Plan Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Plan</Text>
            <View style={styles.planGrid}>
              {getAvailablePlans().map((plan) => {
                const isSelected = selectedPlan
                  ? selectedPlan.id === plan.id
                  : false;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    testID={`plan-${plan.id}`}
                    style={[styles.planGridCard, isSelected && styles.selectedPlanGrid]}
                    onPress={() => {
                      // If user picks a 2-day plan, enable trial mode automatically.
                      if (plan.duration === 2) {
                        setIsTrialMode(true);
                        setSelectedPlan(plan);
                      } else {
                        // Selecting any other plan disables trial mode.
                        setIsTrialMode(false);
                        setSelectedPlan(plan);
                      }
                    }}
                    disabled={isTrialMode && plan.duration !== 2}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadgeGrid}>
                        <Text style={styles.popularTextGrid}>⭐ POPULAR</Text>
                      </View>
                    )}
                    <Text style={styles.planNameGrid}>{plan.name}</Text>
                    <Text style={styles.planDurationGrid}>
                      {plan.duration} days
                    </Text>
                    <View style={styles.planPricingGrid}>
                      <Text style={styles.planPriceGrid}>
                        ₹{plan.discountedPrice}
                      </Text>
                    </View>
                    <Text style={styles.planDescriptionGrid} numberOfLines={2}>
                      {plan.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

         

          {/* Nutrition Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Information</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {meal.nutritionInfo.calories}
                </Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {meal.nutritionInfo.protein}g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {meal.nutritionInfo.carbs}g
                </Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {meal.nutritionInfo.fat}g
                </Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>


          

          {/* Add-on Meal Type Filter */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Addon Type</Text>
            <View style={styles.mealTypeContainer}>
              {(['veg','nonveg','both'] as const).map(opt => {
                const isSelected = addonMealFilter === opt;
                const label = opt === 'veg' ? 'Veg' : opt === 'nonveg' ? 'Non-Veg' : 'Both';
                return (
                  <TouchableOpacity
                    key={opt}
                    testID={`addon-filter-${opt}`}
                    style={[styles.mealTypeButton, isSelected && styles.selectedMealType]}
                    onPress={() => {
                      setAddonMealFilter(opt);
                      setAddonFilterManuallySet(true);
                    }}
                  >
                    <Text style={styles.mealTypeText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={{fontSize:12,color:'#888',marginTop:4}}>Addon type auto-selects based on meal type, but you can override it here.</Text>
          </View> */}

          {/* ...existing code... */}

          {/* Add-ons */}
          <View style={styles.section}>
            {meal.allowDaySelection && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sectionTitle}>
                  Select Days for this item
                </Text>
                <View style={styles.daysRow}>
                  {availableDays.map((d) => {
                    const active = productDays.includes(d.key);
                    return (
                      <TouchableOpacity
                        key={`product-${d.key}`}
                        style={[styles.dayChip, active && styles.dayChipActive]}
                        onPress={() =>
                          setProductDays((prev) =>
                            active
                              ? prev.filter((x) => x !== d.key)
                              : [...prev, d.key]
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            active && styles.dayChipTextActive,
                          ]}
                        >
                          {d.short}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {productDays.length === 0 && (
                  <Text style={styles.applyAllDaysNote}>
                    No day selected → applies to all working days
                  </Text>
                )}
              </View>
            )}
          </View>

         

         
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <View style={styles.priceBreakdown}>
            
            <Text style={styles.totalPriceValue}><Text style={styles.totalPriceLabel}>Total Price</Text> ₹{calculateTotalPrice()}</Text>
            {isTrialMode && (
              <Text style={styles.trialDiscount}>
                Trial Plan: ₹{meal ? meal.price * 2 : 0}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 16, marginRight: 4 }}>Trial Mode</Text>
            <Switch
              value={isTrialMode}
              onValueChange={setIsTrialMode}
              trackColor={{ false: "#E5E7EB", true: "#48479B" }}
              thumbColor={isTrialMode ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>
        </View>
        <TouchableOpacity
          testID="proceed-to-checkout"
          style={styles.proceedButton}
          onPress={handleProceed}
        >
          <Text style={styles.proceedButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <SafeAreaView style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Select Start Date</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDatePicker(false)}
            >
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.datePickerContent}>
            <Text style={styles.datePickerDescription}>
              Choose when you want your subscription to start. You can select
              today or any future date.
            </Text>

            <View style={styles.dateOptionsContainer}>
              {/* Today Option */}
              <TouchableOpacity
                style={[
                  styles.dateOption,
                  startDate.toDateString() === new Date().toDateString() &&
                    styles.selectedDateOption,
                ]}
                onPress={() => {
                  setStartDate(new Date());
                  setShowDatePicker(false);
                }}
              >
                <View style={styles.dateOptionContent}>
                  <Text style={styles.dateOptionTitle}>Today</Text>
                  <Text style={styles.dateOptionSubtitle}>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </Text>
                </View>
                {startDate.toDateString() === new Date().toDateString() && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Tomorrow Option */}
              {(() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return (
                  <TouchableOpacity
                    style={[
                      styles.dateOption,
                      startDate.toDateString() === tomorrow.toDateString() &&
                        styles.selectedDateOption,
                    ]}
                    onPress={() => {
                      setStartDate(tomorrow);
                      setShowDatePicker(false);
                    }}
                  >
                    <View style={styles.dateOptionContent}>
                      <Text style={styles.dateOptionTitle}>Tomorrow</Text>
                      <Text style={styles.dateOptionSubtitle}>
                        {tomorrow.toLocaleDateString("en-US", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </Text>
                    </View>
                    {startDate.toDateString() === tomorrow.toDateString() && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })()}

              {/* Next Week Options */}
              {Array.from({ length: 7 }, (_, i) => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + i + 2);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dateOption,
                      startDate.toDateString() === futureDate.toDateString() &&
                        styles.selectedDateOption,
                    ]}
                    onPress={() => {
                      setStartDate(futureDate);
                      setShowDatePicker(false);
                    }}
                  >
                    <View style={styles.dateOptionContent}>
                      <Text style={styles.dateOptionTitle}>
                        {futureDate.toLocaleDateString("en-US", {
                          weekday: "long",
                        })}
                      </Text>
                      <Text style={styles.dateOptionSubtitle}>
                        {futureDate.toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    {startDate.toDateString() === futureDate.toDateString() && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.datePickerNote}>
              <Text style={styles.datePickerNoteText}>
                💡 Your subscription will start on the selected date. You can
                modify or skip meals up to the cutoff time.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add-ons Modal - New Design */}
      <AddOnsModal
        visible={showAddOnsDrawer}
        onClose={() => setShowAddOnsDrawer(false)}
        addOns={filteredAddOns}
        selectedAddOns={selectedAddOns}
        onToggleAddOn={handleAddOnToggle}
        planPrice={selectedPlan?.discountedPrice || 0}
        weekType={weekType}
        isTrialMode={isTrialMode}
        selectedAddOnDays={selectedAddOnDays}
        onToggleAddOnDay={toggleAddOnDay}
        planDuration={selectedPlan?.duration || 0}
      />

      {/* Floating Add-ons Button */}
      <TouchableOpacity
        style={styles.floatingAddOnsButton}
        onPress={() => setShowAddOnsDrawer(true)}
        activeOpacity={0.9}
      >
        <View style={styles.floatingButtonContent}>
          <Plus size={20} color="white" />
          <Text style={styles.floatingButtonText}>Add-ons</Text>
        </View>
        {selectedAddOns.length > 0 && (
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>{selectedAddOns.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    position: "relative",
  },
  mealImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  content: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  basicInfo: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  mealName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
    flex: 1,
    marginRight: 16,
    letterSpacing: -0.5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 26,
    fontWeight: "900",
    color: "#48479B",
  },
  originalPrice: {
    fontSize: 18,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  tags: {
    flexDirection: "row",
    marginLeft: "auto",
  },
  vegTag: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  eggTag: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F59E0B",
  },
  nonVegTag: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nutritionItem: {
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#48479B",
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  ingredients: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  mealTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "white",
  },
  selectedMealType: {
    color: "#48479B",
    borderColor: "#48479B",
    backgroundColor: "#FEF2F2",
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#48479B",
  },
  planContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  selectedPlan: {
    borderColor: "#48479B",
    backgroundColor: "#FEF2F2",
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    right: 16,
    backgroundColor: "#48479B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  planName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  planPricing: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#48479B",
  },
  planOriginalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  planDescription: {
    fontSize: 12,
    color: "#666",
  },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  planGridCard: {
    flex: 1,
    minWidth: '47%',
    maxWidth: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
    minHeight: 135,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedPlanGrid: {
    borderColor: Colors.primary,
    backgroundColor: "#ffffff",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  popularBadgeGrid: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularTextGrid: {
    color: '#1F2937',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  planNameGrid: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 3,
    marginTop: 2,
  },
  planDurationGrid: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
    fontWeight: '500',
  },
  planPricingGrid: {
    marginBottom: 8,
  },
  planPriceGrid: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#48479B',
  },
  planDescriptionGrid: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
  },
  floatingAddOnsButton: {
    position: 'absolute',
    bottom: 162,
    right: 20,
    backgroundColor:Colors.accent,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#48479B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  floatingBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor:Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  floatingBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  trialNote: {
    fontSize: 14,
    color: "#10B981",
    fontStyle: "italic",
  },
  selectedAddOnsPreview: {
    marginTop: 8,
    gap: 4,
  },
  selectedAddOnText: {
    fontSize: 14,
    color: "#666",
  },
  moreAddOnsText: {
    fontSize: 14,
    color: "#48479B",
    fontWeight: "600",
  },
  timeSlotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlotButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "white",
    gap: 6,
  },
  selectedTimeSlot: {
    borderColor: "#48479B",
    backgroundColor: "rgba(163, 211, 151, 0.27)",
  },
  weekTypeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  weekTypeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "white",
  },
  weekTypeSelected: {
    borderColor: "#48479B",
    backgroundColor: "rgba(163, 211, 151, 0.27)",
  },
  weekTypeText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  weekTypeTextSelected: {
    color: "#48479B",
    fontWeight: "700",
  },
  weekendOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  weekendOptionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "white",
  },
  weekendOptionSelected: {
    borderColor: "#48479B",
    backgroundColor: "rgba(163, 211, 151, 0.27)",
  },
  weekendOptionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  weekendOptionTextSelected: {
    color: "#48479B",
    fontWeight: "700",
  },
  timeSlotText: {
    fontSize: 14,
    color: "#333",
  },
  selectedTimeSlotText: {
    color: "#48479B",
    fontWeight: "600",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateContent: {
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  datePickerContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  datePickerContent: {
    flex: 1,
    padding: 20,
  },
  datePickerDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  dateOptionsContainer: {
    gap: 12,
  },
  dateOption: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateOption: {
    borderColor: "#48479B",
    // backgroundColor: 'rgba(163, 211, 151, 0.27)',
  },
  dateOptionContent: {
    flex: 1,
  },
  dateOptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  dateOptionSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#48479B",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerNote: {
    backgroundColor: "#EEF2FF",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  datePickerNoteText: {
    fontSize: 14,
    color: "#4F46E5",
    lineHeight: 20,
    textAlign: "center",
  },
  bottomActions: {
    padding: 9,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  priceBreakdown: {
    marginBottom: 16,
  },
  totalPriceLabel: {
    fontSize: 14,
    color: "#666",
  },
  totalPriceValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#48479B",
  },
  trialDiscount: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  proceedButton: {
    backgroundColor: "#48479B",
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#48479B",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  proceedButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  drawerContent: {
    flex: 1,
    padding: 20,
  },
  drawerAddOnCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedDrawerAddOn: {
    borderColor: "#48479B",
    backgroundColor: "rgba(163, 211, 151, 0.27)",
  },
  addOnRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addOnImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: "#F3F4F6",
  },
  drawerFooter: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  doneButton: {
    backgroundColor: "#48479B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  variantPill: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  variantPillText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  addOnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addOnToggle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#48479B",
  },
  addOnsContainer: {
    gap: 12,
  },
  selectedAddOn: {
    borderColor: "#48479B",
    backgroundColor: "rgba(163, 211, 151, 0.27)",
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  addOnDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  addOnPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#48479B",
  },
  addOnSelected: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#48479B",
    justifyContent: "center",
    alignItems: "center",
  },
  daySelectorContainer: {
    marginTop: 12,
  },
  daySelectorLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  dayChipActive: {
    borderColor: "#48479B",
    backgroundColor: "rgba(163, 211, 151, 0.27)",
  },
  dayChipText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  dayChipTextActive: {
    color: "#48479B",
    fontWeight: "700",
  },
  applyAllDaysNote: {
    marginTop: 6,
    fontSize: 12,
    color: "#10B981",
  },
  checkMark: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  emptyMealsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyMealsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMealsDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  mealsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mealsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mealsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  mealsHeaderActions: {
    flexDirection: "row",
    gap: 8,
  },
  mealsAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mealsAddBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  mealsViewAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mealsViewAllText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
  },
  mealsRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 4,
  },
  mealTinyCard: {
    width: 140,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "white",
  },
  mealTinyThumb: {
    width: "100%",
    height: 70,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  mealTinyName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  mealTinyMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 6,
  },
  mealTinyBadges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  toggleActiveBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleActiveText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  mealImageText: {
    fontSize: 24,
  },
  customHeader: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 3,
    elevation: 4,
  },
  customHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  customHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  customHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  mealInfo: {
    flex: 1,
  },
  vegBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vegBadgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  noAddOnsContainer: {
    padding: 20,
    marginVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noAddOnsText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  addOnsCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
  },
});
