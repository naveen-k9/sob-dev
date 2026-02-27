import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Clock } from "lucide-react-native";
import { Subscription, Meal, AddOn, AppSettings } from "@/types";
import db from "@/db";
import { router } from "expo-router";
import { Colors, getColors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

interface TodayMealItem {
  id: string;
  subscriptionId: string;
  mealName: string;
  mealType?: "breakfast" | "lunch" | "dinner";
  mealImage?: string;
  deliveryTime: string;
  addOns: string[];
  status: "scheduled" | "cooking" | "ready" | "out_for_delivery" | "delivered";
  canAddItems: boolean;
  cutoffTime?: string;
}

const STATUS_LABELS: Record<TodayMealItem["status"], string> = {
  scheduled: "Scheduled for today",
  cooking: "Cooking started",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

interface TodayMealSliderProps {
  userId: string;
  subscriptions: Subscription[];
  onRefresh?: () => void;
}

export default function TodayMealSlider({
  userId,
  subscriptions,
  onRefresh,
}: TodayMealSliderProps) {
  const [todayMeals, setTodayMeals] = useState<TodayMealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealsMap, setMealsMap] = useState<Record<string, Meal>>({});
  const [addOnsMap, setAddOnsMap] = useState<Record<string, AddOn>>({});
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  useEffect(() => {
    loadData();
  }, [subscriptions, userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load meals
      const allMeals = await db.getMeals();
      const mMap: Record<string, Meal> = {};
      allMeals.forEach((m) => {
        mMap[m.id] = m;
      });
      setMealsMap(mMap);

      // Load add-ons
      const addOnsData = await db.getAddOns();
      const aMap: Record<string, AddOn> = {};
      addOnsData.forEach((a) => {
        aMap[a.id] = a;
      });
      setAddOnsMap(aMap);

      // Load app settings
      const settings = await db.getAppSettings();
      setAppSettings(settings);

      // Generate today's meals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split("T")[0];

      const todayMeals: TodayMealItem[] = [];

      for (const subscription of subscriptions) {
        if (subscription.status !== "active") continue;

        const subStart = new Date(subscription.startDate);
        const subEnd = new Date(subscription.endDate);
        subStart.setHours(0, 0, 0, 0);
        subEnd.setHours(0, 0, 0, 0);

        // Check if today is within subscription period
        if (today < subStart || today > subEnd) continue;

        // Check if today is a delivery day
        const isSkipped =
          subscription.skippedDates?.includes(todayString) || false;
        if (isSkipped) continue;

        // Check weekend exclusion
        const day = today.getDay();
        const weekendExclusion = subscription.weekendExclusion || "none";
        if (
          (weekendExclusion === "both" && (day === 0 || day === 6)) ||
          (weekendExclusion === "saturday" && day === 6) ||
          (weekendExclusion === "sunday" && day === 0)
        ) {
          continue;
        }

        // Get meal details
        const meal = mMap[subscription.mealId];
        if (!meal) continue;

        // Get add-ons
        const subscriptionAddOns = subscription.addOns || [];
        const additionalAddOnsForDate =
          subscription.additionalAddOns?.[todayString] || [];
        const allAddOnIds = [
          ...subscriptionAddOns,
          ...additionalAddOnsForDate,
        ];
        // Determine status based on time
        const currentHour = new Date().getHours();
        let status: TodayMealItem["status"] = "scheduled";

        if (currentHour >= 8 && currentHour < 11) status = "cooking";
        else if (currentHour >= 11 && currentHour < 12) status = "ready";
        else if (currentHour >= 12 && currentHour < 14) status = "out_for_delivery";
        else if (currentHour >= 14) status = "delivered";

        // Check if add-ons can be added
        const { canModifyAddOns } = require("@/utils/cutoffTimeUtils");
        const addOnResult = canModifyAddOns(today, settings);

        const sub = subscription as Subscription & { mealType?: string };
        const m = meal as Meal & { mealType?: string };
        const mealTypeVal = sub.mealType || m.mealType;
        const mealType = ["breakfast", "lunch", "dinner"].includes(mealTypeVal || "")
          ? (mealTypeVal as "breakfast" | "lunch" | "dinner")
          : undefined;
        todayMeals.push({
          id: `meal-${subscription.id}-${todayString}`,
          subscriptionId: subscription.id,
          mealName: meal.name,
          mealType,
          mealImage: meal.images[0],
          deliveryTime:
            subscription.deliveryTimeSlot ||
            subscription.deliveryTime ||
            "12:00 PM - 1:00 PM",
          addOns: allAddOnIds,
          status,
          canAddItems: addOnResult.canProceed,
          cutoffTime: addOnResult.cutoffTime,
        });
      }

      setTodayMeals(todayMeals);
    } catch (error) {
      console.error("Error loading today's meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItems = (subscriptionId: string) => {
    router.push({
      pathname: "/(tabs)/orders",
      params: { subscriptionId, action: "addItems" },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* <Text style={styles.sectionTitle}>Today's Meals</Text> */}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading today's meals...</Text>
        </View>
      </View>
    );
  }

  if (todayMeals.length === 0) {
    return null; // Don't show section if no meals today
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.sectionTitle}>Today's Deliveries</Text>
        <Text style={styles.mealCount}>
          {todayMeals.length} meal{todayMeals.length !== 1 ? "s" : ""}
        </Text>
      </View> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {todayMeals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/orders")}
            style={styles.cardWrapper}
          >
            <LinearGradient
              // colors={["#1E1E2E", "#252538", "#1A1A2A"]}
              colors={[colors.surface, colors.surfaceSecondary]}
              style={styles.mealCard}
            >
              <View style={styles.cardInner}>
                <View style={styles.mealImageContainer}>
                  {meal.mealImage ? (
                    <Image
                      source={{ uri: meal.mealImage }}
                      style={styles.mealImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.mealImage, styles.mealImagePlaceholder]}>
                      <Text style={styles.placeholderEmoji}>🍽️</Text>
                    </View>
                  )}
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {STATUS_LABELS[meal.status]}
                    </Text>
                  </View>
                </View>

                <View style={styles.mealDetails}>
                  <Text style={styles.mealName} numberOfLines={1}>
                    {meal.mealName}
                  </Text>
                  <Text style={styles.deliveryTime}>{meal.deliveryTime}</Text>
                  {meal.addOns.length > 0 && (
                    <View style={styles.addOnsContainer}>
                      <Text style={styles.addOnsLabel}>Addons</Text>
                      <View style={styles.addOnsImagesRow}>
                        {meal.addOns.map((addOnId) => {
                          const addOn = addOnsMap[addOnId];
                          if (!addOn?.image) return null;
                          return (
                            <View key={addOnId} style={styles.addOnItem}>
                              <Image
                                source={{ uri: addOn.image }}
                                style={styles.addOnImage}
                                resizeMode="cover"
                              />
                              <Text style={styles.addOnLabel} numberOfLines={1}>
                                {addOn.name}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {meal.canAddItems && meal.cutoffTime ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddItems(meal.subscriptionId);
                      }}
                      style={styles.addItemsButtonWrapper}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={[Colors.accent, Colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.addItemsButton}
                      >
                        <Clock size={16} color="#FFF" strokeWidth={2.5} />
                        <Text style={styles.addItemsText}>
                        {meal.cutoffTime} + Add Items
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_BORDER_COLOR = "rgba(255, 255, 255, 0.12)";

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  mealCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 27,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    // shadowColor: "#0F0F1A",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.35,
    // shadowRadius: 12,
    // elevation: 6,
  },
  mealCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    minHeight: 144,
  },
  mealImageContainer: {
    width: "42%",
    minHeight: 140,
    position: "relative",
  },
  mealImage: {
    width: "100%",
    height: "100%",
    minHeight: 140,
  },
  mealImagePlaceholder: {
    backgroundColor: "#2A2A3E",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  mealDetails: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingRight: 16,
    justifyContent: "space-between",
  },
  mealName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  deliveryTime: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  addOnsContainer: {
    marginBottom: 10,
  },
  addOnsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },
  addOnsImagesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  addOnItem: {
    alignItems: "center",
    maxWidth: 44,
  },
  addOnImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  addOnLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "center",
  },
  addOnsText: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  addItemsButtonWrapper: {
    alignSelf: "flex-end",
    borderRadius: 10,
    overflow: "hidden",
  },
  addItemsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    borderRadius: 10,
  },
  addItemsText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
