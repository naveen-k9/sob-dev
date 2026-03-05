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
import { isActivePlanDate } from "@/utils/subscriptionDateUtils";

const DAY_LABELS: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

/** JS getDay(): 0=Sun, 1=Mon, ... 6=Sat -> keys used in weeklyMenu */
const DAY_KEYS: ("sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat")[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

function getDayKey(date: Date): "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun" {
  return DAY_KEYS[date.getDay()] as "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
}

interface WeekDayItem {
  date: Date;
  dateNum: number;
  label: string;
  isToday: boolean;
}

function getWeekDays(anchor: Date): WeekDayItem[] {
  const mon = new Date(anchor);
  const d = anchor.getDay();
  const diff = d === 0 ? -6 : 1 - d;
  mon.setDate(mon.getDate() + diff);
  mon.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: WeekDayItem[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    days.push({
      date: d,
      dateNum: d.getDate(),
      label: d.getTime() === today.getTime() ? "Today" : DAY_LABELS[d.getDay()],
      isToday: d.getTime() === today.getTime(),
    });
  }
  return days;
}

interface WeeklyMealItem {
  id: string;
  subscriptionId: string;
  mealName: string;
  mealType?: "breakfast" | "lunch" | "dinner";
  mealImage?: string;
  deliveryTime: string;
  weeklyMenuText: string;
  addOns: string[];
  canAddItems: boolean;
  cutoffTime?: string;
}

interface WeeklyMenuSliderProps {
  userId: string;
  subscriptions: Subscription[];
  onRefresh?: () => void;
}

export default function WeeklyMenuSlider({
  userId,
  subscriptions,
  onRefresh,
}: WeeklyMenuSliderProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });
  const [dayMeals, setDayMeals] = useState<WeeklyMealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealsMap, setMealsMap] = useState<Record<string, Meal>>({});
  const [addOnsMap, setAddOnsMap] = useState<Record<string, AddOn>>({});
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const weekDays = getWeekDays(selectedDate);

  useEffect(() => {
    loadData();
  }, [subscriptions, userId]);

  useEffect(() => {
    computeDayMeals();
  }, [selectedDate, mealsMap, addOnsMap, subscriptions, appSettings]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allMeals, addOnsData, settings] = await Promise.all([
        db.getMeals(),
        db.getAddOns(),
        db.getAppSettings(),
      ]);
      const mMap: Record<string, Meal> = {};
      allMeals.forEach((m) => {
        mMap[m.id] = m;
      });
      setMealsMap(mMap);
      const aMap: Record<string, AddOn> = {};
      addOnsData.forEach((a) => {
        aMap[a.id] = a;
      });
      setAddOnsMap(aMap);
      setAppSettings(settings);
    } catch (error) {
      console.error("Error loading weekly menu data:", error);
    } finally {
      setLoading(false);
    }
  };

  const computeDayMeals = () => {
    const list: WeeklyMealItem[] = [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    const dayKey = getDayKey(selectedDate);

    for (const subscription of subscriptions) {
      if (
        subscription.status !== "active" &&
        subscription.status !== "renewed" &&
        subscription.status !== "expiring"
      )
        continue;
      if (!isActivePlanDate(selectedDate, subscription)) continue;

      const meal = mealsMap[subscription.mealId];
      if (!meal) continue;

      const subscriptionAddOns = subscription.addOns || [];
      const additionalAddOnsForDate =
        subscription.additionalAddOns?.[dateStr] || [];
      const allAddOnIds = [...subscriptionAddOns, ...additionalAddOnsForDate];

      const { canModifyAddOns } = require("@/utils/cutoffTimeUtils");
      const addOnResult = canModifyAddOns(selectedDate, appSettings);

      const weeklyMenuText =
        (meal.weeklyMenuByDate?.[dateStr] ?? meal.weeklyMenu?.[dayKey])?.trim() || "";

      const sub = subscription as Subscription & { mealType?: string };
      const m = meal as Meal & { mealType?: string };
      const mealTypeVal = sub.mealType || m.mealType;
      const mealType = ["breakfast", "lunch", "dinner"].includes(
        mealTypeVal || ""
      )
        ? (mealTypeVal as "breakfast" | "lunch" | "dinner")
        : undefined;

      list.push({
        id: `meal-${subscription.id}-${dateStr}`,
        subscriptionId: subscription.id,
        mealName: meal.name,
        mealType,
        mealImage: meal.images?.[0],
        deliveryTime:
          subscription.deliveryTimeSlot ||
          subscription.deliveryTime ||
          "12:00 PM - 1:00 PM",
        weeklyMenuText,
        addOns: allAddOnIds,
        canAddItems: addOnResult.canProceed,
        cutoffTime: addOnResult.cutoffTime,
      });
    }
    setDayMeals(list);
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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading weekly menu...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekHeaderScroll}
        contentContainerStyle={styles.weekHeaderContent}
      >
        {weekDays.map((day) => {
          const isSelected =
            selectedDate.getTime() === day.date.getTime();
          return (
            <TouchableOpacity
              key={day.date.toISOString()}
              style={styles.dayChip}
              onPress={() => setSelectedDate(day.date)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dayLabel,
                  { color: colors.text },
                ]}
              >
                {day.label}
              </Text>
              <View
                style={[
                  styles.dateCircle,
                  isSelected && styles.dateCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dateNum,
                    isSelected && styles.dateNumSelected,
                  ]}
                >
                  {String(day.dateNum).padStart(2, "0")}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {dayMeals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              No deliveries on this day
            </Text>
          </View>
        ) : (
          dayMeals.map((meal) => (
            <TouchableOpacity
              key={meal.id}
              activeOpacity={0.9}
              onPress={() => router.push("/(tabs)/orders")}
              style={styles.cardWrapper}
            >
              <LinearGradient
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
                  </View>

                  <View style={styles.mealDetails}>
                    <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>
                      {meal.mealName}
                    </Text>
                    <Text style={styles.deliveryTime}>{meal.deliveryTime}</Text>

                    {meal.weeklyMenuText ? (
                      <View style={styles.weeklyMenuContainer}>
                        <Text
                          style={[styles.weeklyMenuText, { color: colors.textSecondary }]}
                          numberOfLines={3}
                        >
                          {meal.weeklyMenuText}
                        </Text>
                      </View>
                    ) : null}

                    {meal.addOns.length > 0 && (
                      <View style={styles.addOnsContainer}>
                        <Text style={[styles.addOnsLabel, { color: colors.text }]}>
                          Addons
                        </Text>
                        <View style={styles.addOnsImagesRow}>
                          {meal.addOns.map((addOnId, index) => {
                            const addOn = addOnsMap[addOnId];
                            if (!addOn?.image) return null;
                            return (
                              <View
                                key={`${addOnId}-${index}`}
                                style={styles.addOnItem}
                              >
                                <Image
                                  source={{ uri: addOn.image }}
                                  style={styles.addOnImage}
                                  resizeMode="cover"
                                />
                                <Text
                                  style={styles.addOnLabel}
                                  numberOfLines={1}
                                >
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
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  weekHeaderScroll: {
    marginBottom: 16,
  },
  weekHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    gap: 12,
  },
  dayChip: {
    alignItems: "center",
    minWidth: 44,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  dateCircleSelected: {
    backgroundColor: Colors.primary,
  },
  dateNum: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  dateNumSelected: {
    color: "#FFFFFF",
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  cardWrapper: {
    borderRadius: 27,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  mealCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    minHeight: 120,
  },
  mealImageContainer: {
    width: "42%",
    minHeight: 120,
    position: "relative",
  },
  mealImage: {
    width: "100%",
    height: "100%",
    minHeight: 120,
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
    marginBottom: 4,
  },
  deliveryTime: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  weeklyMenuContainer: {
    marginBottom: 8,
  },
  weeklyMenuText: {
    fontSize: 13,
    lineHeight: 18,
  },
  addOnsContainer: {
    marginBottom: 10,
  },
  addOnsLabel: {
    fontSize: 13,
    fontWeight: "600",
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
