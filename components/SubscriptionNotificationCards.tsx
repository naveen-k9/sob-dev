import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { CheckCircle, Bike, Truck } from "lucide-react-native";
import { Subscription, Meal, AddOn } from "@/types";
import db from "@/db";
import { router } from "expo-router";

interface NotificationMealItem {
  id: string;
  subscriptionId: string;
  mealName: string;
  deliveryTime: string;
  status: "scheduled" | "cooking" | "ready" | "out_for_delivery" | "delivered";
}

interface SubscriptionNotificationCardsProps {
  userId: string;
  subscriptions: Subscription[];
}

export default function SubscriptionNotificationCards({
  userId,
  subscriptions,
}: SubscriptionNotificationCardsProps) {
  const [items, setItems] = useState<NotificationMealItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const allMeals = await db.getMeals();
        const mMap: Record<string, Meal> = {};
        allMeals.forEach((m) => {
          mMap[m.id] = m;
        });
        const addOnsData = await db.getAddOns();
        const aMap: Record<string, AddOn> = {};
        addOnsData.forEach((a) => {
          aMap[a.id] = a;
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split("T")[0];
        const currentHour = new Date().getHours();
        const list: NotificationMealItem[] = [];

        for (const subscription of subscriptions) {
          if (subscription.status !== "active") continue;
          const subStart = new Date(subscription.startDate);
          const subEnd = new Date(subscription.endDate);
          subStart.setHours(0, 0, 0, 0);
          subEnd.setHours(0, 0, 0, 0);
          if (today < subStart || today > subEnd) continue;
          if (subscription.skippedDates?.includes(todayString)) continue;
          const day = today.getDay();
          const weekendExclusion = subscription.weekendExclusion || "none";
          if (
            (weekendExclusion === "both" && (day === 0 || day === 6)) ||
            (weekendExclusion === "saturday" && day === 6) ||
            (weekendExclusion === "sunday" && day === 0)
          ) {
            continue;
          }
          const meal = mMap[subscription.mealId];
          if (!meal) continue;

          let status: NotificationMealItem["status"] = "scheduled";
          if (currentHour >= 8 && currentHour < 11) status = "cooking";
          else if (currentHour >= 11 && currentHour < 12) status = "ready";
          else if (currentHour >= 12 && currentHour < 14)
            status = "out_for_delivery";
          else if (currentHour >= 14) status = "delivered";

          list.push({
            id: `notif-${subscription.id}-${todayString}`,
            subscriptionId: subscription.id,
            mealName: meal.name,
            deliveryTime:
              subscription.deliveryTimeSlot ||
              subscription.deliveryTime ||
              "12:00 PM",
            status,
          });
        }
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [subscriptions, userId]);

  const handlePress = (item: NotificationMealItem, action: "details" | "track") => {
    router.push("/(tabs)/orders");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const cardContent = (item: NotificationMealItem) => {
    const isDelivered = item.status === "delivered";
    const isOutForDelivery = item.status === "out_for_delivery";
    const statusLabel = isDelivered
      ? "Delivered"
      : isOutForDelivery
        ? "Out for delivery"
        : "Scheduled";
    const buttonLabel = isDelivered ? "View Details" : "Track";
    const action: "details" | "track" = isDelivered ? "details" : "track";

    const IconComponent = isDelivered
      ? CheckCircle
      : isOutForDelivery
        ? Truck
        : Bike;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.cardWrapper}
        onPress={() => handlePress(item, action)}
        activeOpacity={0.92}
      >
        <View style={styles.card}>
          <View style={styles.cardInner}>
            {/* Top: icon top-left */}
            <View style={styles.iconContainer}>
              {isDelivered ? (
                <View style={styles.iconCircleSuccess}>
                  <CheckCircle size={14} color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.iconCircleDefault}>
                  <IconComponent size={14} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Title + subtitle block */}
            <Text style={styles.title} numberOfLines={1}>
              {statusLabel}: {item.mealName}
            </Text>
            {/* <Text style={styles.subtitle}>Meal</Text> */}

            {/* Time */}
            <Text style={styles.time}>{item.deliveryTime}</Text>

            {/* Spacer: pushes button to bottom */}
            <View style={styles.spacer} />

            {/* Bottom: primary action right-aligned */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.button}
                onPress={(e) => {
                  e.stopPropagation();
                  handlePress(item, action);
                }}
              >
                <Text style={styles.buttonText}>{buttonLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => cardContent(item))}
      </ScrollView>
    </View>
  );
}

const CARD_BG = "rgba(32, 32, 42, 0.92)";
const CARD_WIDTH = 207;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingRight: 20,
    gap: 8,
  },
  cardWrapper: {
    marginRight: 8,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    ...(Platform.OS === "ios" && { overflow: "hidden" }),
  },
  cardInner: {
    padding: 10,
    minHeight: 98,
    justifyContent: "space-between",
  },
  iconContainer: {
    marginBottom: 6,
  },
  iconCircleSuccess: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleDefault: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 16,
    marginBottom: 1,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 6,
    fontWeight: "500",
  },
  spacer: {
    flex: 1,
    minHeight: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 72,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1F2937",
    letterSpacing: 0.2,
  },
  loadingText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    padding: 12,
  },
});
