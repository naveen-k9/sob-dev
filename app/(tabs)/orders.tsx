import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  FlatList,
  RefreshControl,
  TextInput,
  Image,
} from "react-native";
import {
  ShoppingBag,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Truck,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  X,
  Package,
  ChefHat,
  ArrowLeft,
  Pencil,
  Wallet,
  CreditCard,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import { getUserSubscriptions, addOns } from "@/constants/data";
import { Subscription, Meal, AddOn, AppSettings, Order } from "@/types";
import db from "@/db";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import RazorpayCheckout from "react-native-razorpay";
import { sendAddonPurchaseNotification } from "@/services/whatsapp";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasDelivery: boolean;
  deliveryStatus: "delivered" | "upcoming" | "vacation" | "on_hold" | "skipped";
  subscription?: Subscription;
  canModify: boolean;
}

interface DeliveryDetails {
  id: string;
  mealName: string;
  mealImage?: string;
  addOns: string[];
  deliveryTime: string;
  status:
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "scheduled"
    | "cooking_started"
    | "cooking_done"
    | "ready_for_delivery"
    | "packaging_done"
    | "delivery_started"
    | "reached"
    | "delivery_done";
  estimatedTime?: string;
  deliveryPerson?: string;
  phone?: string;
  subscription?: Subscription;
  canSkip?: boolean;
  canAddItems?: boolean;
  kitchenStaff?: string;
  orderDate: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
}


export default function OrdersScreen() {
  const { user, isGuest, updateUser } = useAuth();
  const params = useLocalSearchParams<{ action?: string; subscriptionId?: string }>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedDateDelivery, setSelectedDateDelivery] =
    useState<DeliveryDetails | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>(
    []
  );
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "processing" | "success" | "failed" | null
  >(null);
  const [mealsMap, setMealsMap] = useState<Record<string, Meal>>({});
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanNames, setEditingPlanNames] = useState<Record<string, string>>({});

  const handleLoginPrompt = () => {
    router.push("/auth/login");
  };

  const loadMealsMap = async () => {
    try {
      const meals = await db.getMeals();
      const map: Record<string, Meal> = {};
      meals.forEach((m) => {
        map[m.id] = m;
      });
      setMealsMap(map);
    } catch (error) {
      console.error("Error loading meals for orders:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadMealsMap();
      loadUserSubscriptions();
      loadAppSettings();
      loadAvailableAddOns();
    }
  }, [user]);

  // Force reload app settings on component mount
  useEffect(() => {
    loadAppSettings();
  }, []);

  useEffect(() => {
    if (user && userSubscriptions.length > 0) {
      if (!selectedPlanId && userSubscriptions.length > 0) {
        setSelectedPlanId(userSubscriptions[0].id);
      }
      generateCalendarDays();
      loadSelectedDateDelivery();
    }
  }, [user, currentDate, userSubscriptions, selectedDate, selectedPlanId, mealsMap]);

  // Handle deep-link from TodayMealSlider "Add Items" button
  useEffect(() => {
    if (params.action === "addItems" && params.subscriptionId && userSubscriptions.length > 0) {
      const sub = userSubscriptions.find((s) => s.id === params.subscriptionId);
      if (sub) {
        setSelectedPlanId(sub.id);
        setSelectedDate(new Date());
        setSelectedAddOns([]);
        setShowAddOnModal(true);
      }
    }
  }, [params.action, params.subscriptionId, userSubscriptions]);

  const loadUserSubscriptions = async () => {
    if (user) {
      try {
        const subs = await db.getUserSubscriptions(user.id);
        setUserSubscriptions(subs);
      } catch (error) {
        console.error("Error loading user subscriptions:", error);
      }
    }
  };

  /**
   * Resolve weekend exclusion setting from subscription
   * Handles both legacy (excludeWeekends boolean) and new (weekendExclusion string) formats
   */
  const resolveWeekendExclusion = (sub: Subscription): string => {
    if (sub.weekType === "everyday") return "none";
    const fromNew = sub.weekendExclusion ?? null;
    if (fromNew) return fromNew;
    // Legacy format: excludeWeekends boolean
    if (sub.excludeWeekends === true) return "both";
    return "none";
  };

  /**
   * Check if a specific date should be excluded based on subscription's weekend settings
   */
  const isWeekendExcludedForDate = (date: Date, sub: Subscription): boolean => {
    if (sub.weekType === "everyday") return false;
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    const setting = resolveWeekendExclusion(sub);
    if (setting === "both") return day === 0 || day === 6;
    if (setting === "saturday") return day === 6;
    if (setting === "sunday") return day === 0;
    return false;
  };

  /**
   * Get a user-friendly label for weekend exclusion setting
   */
  const weekendExclusionLabel = (sub: Subscription): string | null => {
    const setting = resolveWeekendExclusion(sub);
    if (setting === "both") return "• Weekends excluded";
    if (setting === "saturday") return "• Saturdays excluded";
    if (setting === "sunday") return "• Sundays excluded";
    return null;
  };

  const loadAppSettings = async () => {
    try {
      console.log("Loading app settings...");
      const settings = await db.getAppSettings();
      console.log("App settings loaded in orders screen:", settings);
      setAppSettings(settings);

      // Force re-initialize database if settings are missing
      if (!settings || !settings.skipCutoffTime || !settings.addOnCutoffTime) {
        console.log("App settings incomplete, reinitializing database...");
        await db.initialize();
        const newSettings = await db.getAppSettings();
        console.log("New app settings after reinitialization:", newSettings);
        setAppSettings(newSettings);
      }
    } catch (error) {
      console.error("Error loading app settings:", error);
    }
  };

  const loadAvailableAddOns = async () => {
    try {
      const addOnsData = await db.getAddOns();
      setAvailableAddOns(addOnsData.filter((addOn) => addOn.isActive));
    } catch (error) {
      console.error("Error loading add-ons:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMealsMap(), loadUserSubscriptions(), loadAppSettings()]);
    setRefreshing(false);
  };

  // ── Plan name helpers ────────────────────────────────────────────────────
  const getPlanDisplayName = (sub: Subscription, index: number): string => {
    if (editingPlanNames[sub.id] !== undefined) return editingPlanNames[sub.id];
    // Use stored planName only if it's not just the auto-generated "X Day Plan"
    if (sub.planName && !/^\d+ Day Plan$/.test(sub.planName.trim())) {
      return sub.planName;
    }
    const baseName = sub.customerName || user?.name || "User";
    return `${baseName}'s Plan ${index + 1}`;
  };

  const handleSavePlanName = async (subId: string) => {
    const name = editingPlanNames[subId];
    if (name !== undefined && name.trim()) {
      try {
        await db.updateSubscription(subId, { planName: name.trim() });
        await loadUserSubscriptions();
      } catch (e) {
        console.error("Error updating plan name:", e);
      }
    }
    setEditingPlanId(null);
  };

  const getAddOnByName = (name: string): AddOn | undefined =>
    (availableAddOns.length > 0 ? availableAddOns : addOns).find(
      (a) => a.name === name
    );

  const getDeliveryStatusColor = (status: DeliveryDetails["status"]): string => {
    switch (status) {
      case "delivered":
      case "delivery_done": return "#10B981";
      case "out_for_delivery":
      case "delivery_started":
      case "reached": return "#48479B";
      case "cooking_started":
      case "preparing": return "#F59E0B";
      case "cooking_done":
      case "ready_for_delivery":
      case "packaging_done": return "#06B6D4";
      default: return "#6B7280";
    }
  };

  const getDeliveryStatusLabel = (status: DeliveryDetails["status"]): string => {
    switch (status) {
      case "delivered":
      case "delivery_done": return "Delivered";
      case "out_for_delivery": return "Out for Delivery";
      case "delivery_started": return "On the Way";
      case "reached": return "Nearby";
      case "cooking_started": return "Cooking";
      case "cooking_done": return "Cooked";
      case "ready_for_delivery": return "Ready";
      case "packaging_done": return "Packed";
      case "preparing": return "Preparing";
      case "scheduled": return "Scheduled";
      default: return "Scheduled";
    }
  };

  const loadSelectedDateDelivery = () => {
    if (!selectedPlanId) {
      setSelectedDateDelivery(null);
      return;
    }

    const selectedSubscription = userSubscriptions.find(
      (sub) => sub.id === selectedPlanId
    );
    if (!selectedSubscription) {
      setSelectedDateDelivery(null);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateCopy = new Date(selectedDate);
    selectedDateCopy.setHours(0, 0, 0, 0);

    const isToday = selectedDateCopy.getTime() === today.getTime();
    const isPast = selectedDateCopy < today;
    const dateString = selectedDate.toISOString().split("T")[0];

    // Check if this date should have a delivery for the selected subscription
    const subStart = new Date(selectedSubscription.startDate);
    const subEnd = new Date(selectedSubscription.endDate);
    subStart.setHours(0, 0, 0, 0);
    subEnd.setHours(0, 0, 0, 0);

    const isInSubscriptionPeriod =
      selectedDateCopy >= subStart && selectedDateCopy <= subEnd;
    const isWeekendExcluded = isWeekendExcludedForDate(
      selectedDateCopy,
      selectedSubscription
    );
    const isSkipped =
      selectedSubscription.skippedDates?.includes(dateString) || false;

    if (!isInSubscriptionPeriod || isWeekendExcluded) {
      setSelectedDateDelivery(null);
      return;
    }

    if (isSkipped) {
      setSelectedDateDelivery({
        id: selectedSubscription.id,
        mealName: "Meal Skipped",
        addOns: [],
        deliveryTime: "Skipped",
        status: "scheduled",
        subscription: selectedSubscription,
        canSkip: false,
        canAddItems: false,
        orderDate: dateString,
      });
      return;
    }

    // Check if this date is an active plan date (should have delivery)
    const isActivePlanDateResult = isActivePlanDate(
      selectedDateCopy,
      selectedSubscription
    );
    if (!isActivePlanDateResult) {
      setSelectedDateDelivery(null);
      return;
    }

    // Find the meal details from db (correct per meal id)
    const meal = mealsMap[selectedSubscription.mealId];

    // Get base add-ons details
    const subscriptionAddOns = selectedSubscription.addOns || [];

    // Get additional add-ons for this specific date
    const additionalAddOnsForDate =
      selectedSubscription.additionalAddOns?.[dateString] || [];

    // Combine all add-ons
    const allAddOnIds = [...subscriptionAddOns, ...additionalAddOnsForDate];
    const addOnSource = availableAddOns.length > 0 ? availableAddOns : addOns;
    const addOnNames = allAddOnIds
      .map((addOnId) => {
        const addOn = addOnSource.find((a) => a.id === addOnId);
        return addOn ? addOn.name : "";
      })
      .filter(Boolean);

    let status: DeliveryDetails["status"] = "scheduled";
    let deliveryPerson = "";
    let phone = "";
    let estimatedTime = "";

    if (isPast) {
      status = "delivered";
    } else if (isToday) {
      status = "out_for_delivery";
      deliveryPerson = "Raj Kumar";
      phone = "+91 98765 43210";
      estimatedTime = "12:30 PM";
    }

    const deliveryDetails: DeliveryDetails = {
      id: selectedSubscription.id,
      mealName: meal?.name || "Meal",
      mealImage: meal?.images[0],
      addOns: addOnNames,
      deliveryTime:
        selectedSubscription.deliveryTimeSlot ||
        selectedSubscription.deliveryTime ||
        "12:00 PM - 1:00 PM",
      status,
      estimatedTime,
      deliveryPerson,
      phone,
      subscription: selectedSubscription,
      canSkip: checkCanSkip(selectedDate),
      canAddItems: checkCanAddItems(selectedDate),
      orderDate: dateString,
    };

    setSelectedDateDelivery(deliveryDetails);
  };

  const generateCalendarDays = () => {
    if (!selectedPlanId) return;

    const selectedSubscription = userSubscriptions.find(
      (sub) => sub.id === selectedPlanId
    );
    if (!selectedSubscription) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate delivery dates based on subscription start date and weekend exclusions
    const subStart = new Date(selectedSubscription.startDate);
    const subEnd = new Date(selectedSubscription.endDate);
    subStart.setHours(0, 0, 0, 0);
    subEnd.setHours(0, 0, 0, 0);

    const deliveryDates = new Set<string>();
    let currentDeliveryDate = new Date(subStart);
    let deliveredCount = 0;
    const totalDeliveries =
      selectedSubscription.duration ||
      selectedSubscription.totalDeliveries ||
      0;

    // Generate all delivery dates for this subscription
    while (currentDeliveryDate <= subEnd && deliveredCount < totalDeliveries) {
      const dateString = currentDeliveryDate.toISOString().split("T")[0];
      const isSkipped =
        selectedSubscription.skippedDates?.includes(dateString) || false;

      if (isWeekendExcludedForDate(currentDeliveryDate, selectedSubscription)) {
        currentDeliveryDate.setDate(currentDeliveryDate.getDate() + 1);
        continue;
      }

      if (!isSkipped) {
        deliveryDates.add(dateString);
        deliveredCount++;
      } else {
        const extendedEndDate = new Date(subEnd);
        extendedEndDate.setDate(extendedEndDate.getDate() + 1);

        while (
          isWeekendExcludedForDate(extendedEndDate, selectedSubscription)
        ) {
          extendedEndDate.setDate(extendedEndDate.getDate() + 1);
        }

        subEnd.setTime(extendedEndDate.getTime());
      }

      currentDeliveryDate.setDate(currentDeliveryDate.getDate() + 1);
    }

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const isCurrentMonth = date.getMonth() === month;
      const dateString = date.toISOString().split("T")[0];

      const hasDelivery = deliveryDates.has(dateString);
      const isSkipped =
        selectedSubscription.skippedDates?.includes(dateString) || false;

      let deliveryStatus: CalendarDay["deliveryStatus"] = "upcoming";

      if (isSkipped) {
        deliveryStatus = "skipped";
      } else if (date < today && hasDelivery) {
        deliveryStatus = "delivered";
      } else if (isWeekendExcludedForDate(date, selectedSubscription)) {
        deliveryStatus = "vacation";
      } else if (hasDelivery) {
        deliveryStatus = "upcoming";
      }

      const canModify = date > today && hasDelivery && !isSkipped;

      days.push({
        date,
        isCurrentMonth,
        hasDelivery,
        deliveryStatus,
        subscription: hasDelivery ? selectedSubscription : undefined,
        canModify,
      });
    }

    setCalendarDays(days);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const getCalendarStatusColor = (status: CalendarDay["deliveryStatus"]) => {
    switch (status) {
      case "delivered":
        return "#10B981";
      case "upcoming":
        return "#48479B";
      case "vacation":
        return "#F59E0B";
      case "on_hold":
        return "#EF4444";
      case "skipped":
        return "#6B7280";
      default:
        return "#E5E7EB";
    }
  };

  // Using centralized cut-off time utility
  const checkCanSkip = (date: Date): boolean => {
    const { canSkipMeal } = require("@/utils/cutoffTimeUtils");
    const result = canSkipMeal(date, appSettings);
    console.log(`[Cut-off Check] Skip meal for ${date.toDateString()}:`, result);
    return result.canProceed;
  };

  const checkCanAddItems = (date: Date): boolean => {
    const { canModifyAddOns } = require("@/utils/cutoffTimeUtils");
    const result = canModifyAddOns(date, appSettings);
    console.log(`[Cut-off Check] Modify add-ons for ${date.toDateString()}:`, result);
    return result.canProceed;
  };

  const handleSkipMeal = async () => {
    if (!selectedDateDelivery?.subscription) return;

    // Prevent skip if cooking has started (for today's meal)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateCopy = new Date(selectedDate);
    selectedDateCopy.setHours(0, 0, 0, 0);
    
    if (selectedDateCopy.getTime() === today.getTime()) {
      const currentHour = new Date().getHours();
      // If cooking has started (typically after 8 AM), prevent cancellation
      if (currentHour >= 8 && selectedDateDelivery.status !== "scheduled") {
        Alert.alert(
          "Cannot Skip",
          "This meal cannot be skipped as preparation has already started. Please contact support for assistance.",
          [{ text: "OK" }]
        );
        return;
      }
    }

    const dateStr = selectedDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const hasAddOns =
      selectedDateDelivery.addOns && selectedDateDelivery.addOns.length > 0;
    const message = hasAddOns
      ? `Are you sure you want to skip the meal and all add-ons for ${dateStr}? This action cannot be undone.`
      : `Are you sure you want to skip the meal for ${dateStr}?`;

    Alert.alert("Skip Meal", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Skip",
        style: "destructive",
        onPress: async () => {
          try {
            const dateString = selectedDate.toISOString().split("T")[0];
            await db.skipMealForDate(
              selectedDateDelivery.subscription!.id,
              dateString
            );

            // Update the calendar to reflect the skip
            await loadUserSubscriptions();
            loadSelectedDateDelivery();

            Alert.alert(
              "Success",
              hasAddOns
                ? "Meal and add-ons skipped successfully"
                : "Meal skipped successfully"
            );
          } catch (error) {
            console.error("Error skipping meal:", error);
            Alert.alert("Error", "Failed to skip meal. Please try again.");
          }
        },
      },
    ]);
  };

  const handleAddMeal = () => {
    setSelectedAddOns([]);
    setShowAddOnModal(true);
  };

  const getSelectedAddOnsTotal = (): number => {
    return selectedAddOns.reduce((total, addOnId) => {
      const addOn = availableAddOns.find((a) => a.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
  };

  const handleAddOnSelection = (addOnId: string) => {
    setSelectedAddOns((prev) => {
      if (prev.includes(addOnId)) {
        return prev.filter((id) => id !== addOnId);
      } else {
        return [...prev, addOnId];
      }
    });
  };

  const _saveAddOnsAfterPayment = async (
    subscription: Subscription,
    dateString: string,
    total: number
  ) => {
    await db.purchaseAddOnsForDate(subscription.id, dateString, selectedAddOns, user!.id);
    if (user?.phone) {
      const addonNames = selectedAddOns.map((id) => {
        const a = availableAddOns.find((ao) => ao.id === id);
        return a?.name ?? id;
      });
      sendAddonPurchaseNotification(user.phone, {
        customerName: user.name ?? "Customer",
        addonNames,
        date: new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "long" }),
        totalAmount: String(total),
        subscriptionId: subscription.id,
      }).catch((e) => console.log("[WhatsApp addon] error:", e));
    }
    await loadUserSubscriptions();
    loadSelectedDateDelivery();
    setPaymentStatus("success");
    setTimeout(() => {
      setShowPaymentModal(false);
      setShowAddOnModal(false);
      setSelectedAddOns([]);
    }, 1500);
  };

  const handleWalletPayment = async () => {
    const subscription =
      selectedDateDelivery?.subscription ||
      userSubscriptions.find((s) => s.id === selectedPlanId);
    if (!subscription || selectedAddOns.length === 0 || !user?.id) return;

    const total = getSelectedAddOnsTotal();
    const walletBal = user.walletBalance ?? 0;
    if (walletBal < total) {
      Alert.alert(
        "Insufficient Balance",
        `Your wallet balance (₹${walletBal.toFixed(2)}) is less than the total (₹${total}).`
      );
      return;
    }

    setShowPaymentModal(true);
    setPaymentStatus("processing");
    const dateString = selectedDate.toISOString().split("T")[0];
    try {
      await db.addWalletTransaction({
        userId: user.id,
        type: "debit",
        amount: total,
        description: `Add-ons for ${dateString}`,
        orderId: subscription.id,
        referenceId: `addon_wallet_${subscription.id}_${Date.now()}`,
      });
      // Reflect updated balance in auth context
      if (updateUser) updateUser({ walletBalance: walletBal - total });
      await _saveAddOnsAfterPayment(subscription, dateString, total);
    } catch (err: any) {
      console.error("Wallet payment error:", err);
      setPaymentStatus("failed");
    }
  };

  const handleConfirmAddOns = async () => {
    const subscription =
      selectedDateDelivery?.subscription ||
      userSubscriptions.find((s) => s.id === selectedPlanId);
    if (!subscription || selectedAddOns.length === 0) {
      Alert.alert("Error", "Please select at least one add-on");
      return;
    }
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to add items");
      return;
    }

    const total = getSelectedAddOnsTotal();
    const dateString = selectedDate.toISOString().split("T")[0];

    setShowPaymentModal(true);
    setPaymentStatus("processing");
    try {
      const razorpayKey =
        process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_test_RFSonKoJy6tEEL";
      const orderResp = await fetch(
        "https://sameoldbox.com/wp-json/razorpay/v1/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            currency: "INR",
            receipt: `addon_${subscription.id}_${Date.now()}`,
            notes: { description: `Add-ons for ${dateString}` },
          }),
        }
      );

      if (!orderResp.ok) {
        setPaymentStatus("failed");
        return;
      }

      const orderData = await orderResp.json();
      const options = {
        description: `Add-ons for ${dateString}`,
        image: "https://i.imgur.com/3g7nmJC.jpg",
        currency: "INR",
        key: razorpayKey,
        amount: `${Math.round(total * 100)}`,
        name: "SOB",
        order_id: orderData.id,
        prefill: {
          email: user.email ?? "",
          contact: user.phone ?? "",
          name: user.name ?? "Customer",
        },
        theme: { color: "#E53935" },
      };

      RazorpayCheckout.open(options)
        .then(async () => {
          try {
            await _saveAddOnsAfterPayment(subscription, dateString, total);
          } catch (err) {
            console.error("Error saving add-ons after payment:", err);
            setPaymentStatus("failed");
          }
        })
        .catch((error: any) => {
          console.log("[Razorpay addon] cancelled/failed:", error);
          setPaymentStatus("failed");
        });
    } catch (e) {
      console.error("handleConfirmAddOns error:", e);
      setPaymentStatus("failed");
    }
  };

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    const isSelected = selectedDate.toDateString() === day.date.toDateString();
    const isToday = new Date().toDateString() === day.date.toDateString();

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          !day.isCurrentMonth && styles.calendarDayInactive,
          isSelected && styles.calendarDaySelected,
          isToday && styles.calendarDayToday,
          day.hasDelivery && styles.calendarDayWithDelivery,
        ]}
        onPress={() => selectDate(day.date)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.calendarDayText,
            !day.isCurrentMonth && styles.calendarDayTextInactive,
            isSelected && styles.calendarDayTextSelected,
            isToday && styles.calendarDayTextToday,
          ]}
        >
          {day.date.getDate()}
        </Text>
        {(day.hasDelivery ||
          day.deliveryStatus === "skipped" ||
          day.deliveryStatus === "vacation" ||
          day.deliveryStatus === "on_hold") && (
          <View
            style={[
              styles.deliveryIndicator,
              { backgroundColor: getCalendarStatusColor(day.deliveryStatus) },
            ]}
            testID={`indicator-${day.date.toISOString().split("T")[0]}`}
          />
        )}
        {isToday && !isSelected && <View style={styles.todayIndicator} />}
      </TouchableOpacity>
    );
  };

  // Helper function to check if a date is an active plan date
  const isActivePlanDate = (
    date: Date,
    subscription: Subscription
  ): boolean => {
    const subStart = new Date(subscription.startDate);
    const subEnd = new Date(subscription.endDate);
    subStart.setHours(0, 0, 0, 0);
    subEnd.setHours(0, 0, 0, 0);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Must be within subscription period
    if (checkDate < subStart || checkDate > subEnd) {
      return false;
    }

    // Respect weekend exclusion settings
    if (isWeekendExcludedForDate(checkDate, subscription)) {
      return false;
    }

    // Calculate if this date should have a delivery based on the plan
    let currentDeliveryDate = new Date(subStart);
    let deliveredCount = 0;
    const totalDeliveries =
      subscription.duration || subscription.totalDeliveries || 0;

    while (currentDeliveryDate <= subEnd && deliveredCount < totalDeliveries) {
      const currentDateString = currentDeliveryDate.toISOString().split("T")[0];
      const currentIsSkipped =
        subscription.skippedDates?.includes(currentDateString) || false;

      if (isWeekendExcludedForDate(currentDeliveryDate, subscription)) {
        currentDeliveryDate.setDate(currentDeliveryDate.getDate() + 1);
        continue;
      }

      // If this date matches our check date and it's not skipped, it's an active date
      if (
        currentDeliveryDate.getTime() === checkDate.getTime() &&
        !currentIsSkipped
      ) {
        return true;
      }

      // Count non-skipped dates
      if (!currentIsSkipped) {
        deliveredCount++;
      }

      currentDeliveryDate.setDate(currentDeliveryDate.getDate() + 1);
    }

    return false;
  };

  const renderSelectedDateDelivery = () => {
    if (!selectedDateDelivery) {
      const selectedSubscription = userSubscriptions.find(
        (sub) => sub.id === selectedPlanId
      );
      const canAddProducts =
        selectedSubscription &&
        selectedDate >= new Date() &&
        isActivePlanDate(selectedDate, selectedSubscription);

      return (
        <View style={styles.noDeliveryContainer}>
          <Package size={40} color="#D1D5DB" />
          <Text style={styles.noDeliveryText}>No delivery on this day</Text>
          {canAddProducts && (
            <TouchableOpacity style={styles.addProductButton} onPress={handleAddMeal}>
              <Plus size={16} color="#fff" />
              <Text style={styles.addProductButtonText}>Add Items</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    const statusColor = getDeliveryStatusColor(selectedDateDelivery.status);
    const statusLabel = getDeliveryStatusLabel(selectedDateDelivery.status);
    const meal = selectedDateDelivery.subscription
      ? mealsMap[selectedDateDelivery.subscription.mealId]
      : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDay = new Date(selectedDate);
    selDay.setHours(0, 0, 0, 0);
    const isToday = selDay.getTime() === today.getTime();
    const currentHour = new Date().getHours();
    const cookingStarted =
      isToday && currentHour >= 8 && selectedDateDelivery.status !== "scheduled";

    return (
      <View style={styles.richDeliveryCard}>
        {/* Status stripe */}
        <View style={[styles.richStatusStripe, { backgroundColor: statusColor }]} />

        <View style={styles.richCardBody}>
          {/* Top: meal image + name + status badge */}
          <View style={styles.richCardTopRow}>
            {meal?.images?.[0] ? (
              <Image
                source={{ uri: meal.images[0] }}
                style={styles.richMealImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.richMealImage, styles.richMealImagePlaceholder]}>
                <Text style={{ fontSize: 28 }}>🍽️</Text>
              </View>
            )}
            <View style={styles.richMealInfo}>
              <Text style={styles.richMealName} numberOfLines={2}>
                {selectedDateDelivery.mealName}
              </Text>
              <View style={styles.richTimeRow}>
                <Clock size={13} color="#9CA3AF" />
                <Text style={styles.richDeliveryTime}>
                  {selectedDateDelivery.deliveryTime}
                </Text>
              </View>
              {selectedDateDelivery.subscription?.customerName && (
                <Text style={styles.richCustomerName}>
                  For: {selectedDateDelivery.subscription.customerName}
                </Text>
              )}
            </View>
            <View style={[styles.richStatusBadge, { backgroundColor: statusColor + "22" }]}>
              <View style={[styles.richStatusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.richStatusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Add-ons with images */}
          {selectedDateDelivery.addOns.length > 0 && (
            <View style={styles.richAddOnsSection}>
              <Text style={styles.richAddOnsLabel}>Add-ons</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.richAddOnsScroll}
              >
                {selectedDateDelivery.addOns.map((name, i) => {
                  const ao = getAddOnByName(name);
                  return (
                    <View key={i} style={styles.richAddOnChip}>
                      {ao?.image ? (
                        <Image
                          source={{ uri: ao.image }}
                          style={styles.richAddOnImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.richAddOnImage, styles.richAddOnImagePlaceholder]}>
                          <Text style={{ fontSize: 14 }}>🥗</Text>
                        </View>
                      )}
                      <Text style={styles.richAddOnName} numberOfLines={1}>
                        {name}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Delivery / kitchen staff */}
          {(selectedDateDelivery.deliveryPerson || selectedDateDelivery.subscription?.assignedKitchenId) && (
            <View style={styles.richStaffRow}>
              {selectedDateDelivery.subscription?.assignedKitchenId && (
                <View style={styles.richStaffItem}>
                  <ChefHat size={13} color="#9CA3AF" />
                  <Text style={styles.richStaffText}>Chef Ramesh</Text>
                </View>
              )}
              {selectedDateDelivery.deliveryPerson && (
                <View style={styles.richStaffItem}>
                  <Truck size={13} color="#9CA3AF" />
                  <Text style={styles.richStaffText}>
                    {selectedDateDelivery.deliveryPerson}
                    {selectedDateDelivery.estimatedTime
                      ? ` • ETA ${selectedDateDelivery.estimatedTime}`
                      : ""}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Cutoff hint */}
          {appSettings && (selectedDateDelivery.canSkip || selectedDateDelivery.canAddItems) && (() => {
            const { canSkipMeal, canModifyAddOns, getCutoffMessage } = require("@/utils/cutoffTimeUtils");
            const skipResult = canSkipMeal(selectedDate, appSettings);
            const addOnResult = canModifyAddOns(selectedDate, appSettings);
            return (
              <View style={styles.cutoffInfo}>
                <Clock size={12} color="#9CA3AF" />
                <Text style={styles.cutoffText}>
                  {skipResult.canProceed && getCutoffMessage(skipResult, "skip")}
                  {skipResult.canProceed && addOnResult.canProceed && " • "}
                  {addOnResult.canProceed && getCutoffMessage(addOnResult, "add items")}
                </Text>
              </View>
            );
          })()}

          {/* Action buttons */}
          <View style={styles.richActionRow}>
            {selectedDateDelivery.canSkip ? (
              <TouchableOpacity
                style={[styles.richSkipBtn, cookingStarted && styles.richBtnDisabled]}
                onPress={handleSkipMeal}
                testID="skip-meal-button"
                disabled={cookingStarted}
              >
                <XCircle size={15} color={cookingStarted ? "#9CA3AF" : "#EF4444"} />
                <Text style={[styles.richSkipBtnText, cookingStarted && { color: "#9CA3AF" }]}>
                  {cookingStarted ? "Can't Skip" : "Skip Meal"}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.richDisabledNote}>
                <Text style={styles.richDisabledNoteText}>Skip cut-off passed</Text>
              </View>
            )}

            {selectedDateDelivery.canAddItems ? (
              <TouchableOpacity
                style={styles.richAddBtn}
                onPress={handleAddMeal}
                testID="add-items-button"
              >
                <Plus size={15} color="#fff" />
                <Text style={styles.richAddBtnText}>Add Items</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.richDisabledNote}>
                <Text style={styles.richDisabledNoteText}>Add-on cut-off passed</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <ShoppingBag size={64} color="#DDD" />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyDescription}>
            {isGuest
              ? "Sign in to view your order history and track deliveries"
              : "Start ordering delicious meals to see them here"}
          </Text>
          {isGuest && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLoginPrompt}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.screenHeaderText}>
          <Text style={styles.screenHeaderTitle}>My Orders</Text>
          <Text style={styles.screenHeaderSub}>
            {userSubscriptions.length} active plan
            {userSubscriptions.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Active Plans ─────────────────────────────────────────── */}
        {userSubscriptions.length > 0 ? (
          <View style={styles.plansSection}>
            <Text style={styles.plansSectionTitle}>Active Plans</Text>
            {userSubscriptions.map((sub, index) => {
              const isSelected = selectedPlanId === sub.id;
              const isEditing = editingPlanId === sub.id;
              const displayName = getPlanDisplayName(sub, index);
              const daysRemaining = Math.max(
                0,
                Math.ceil(
                  (new Date(sub.endDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              );
              const accentColor = [
                "#48479B",
                "#10B981",
                "#F59E0B",
                "#E53935",
              ][index % 4];
              const mealForPlan = mealsMap[sub.mealId];

              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                    isSelected && { borderColor: accentColor },
                  ]}
                  onPress={() => setSelectedPlanId(sub.id)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[styles.planCardAccent, { backgroundColor: accentColor }]}
                  />
                  <View style={styles.planCardBody}>
                    {/* Name row */}
                    <View style={styles.planCardTopRow}>
                      {isEditing ? (
                        <TextInput
                          style={styles.planCardNameInput}
                          value={editingPlanNames[sub.id] ?? displayName}
                          onChangeText={(v) =>
                            setEditingPlanNames((p) => ({ ...p, [sub.id]: v }))
                          }
                          onBlur={() => handleSavePlanName(sub.id)}
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={() => handleSavePlanName(sub.id)}
                        />
                      ) : (
                        <TouchableOpacity
                          style={styles.planCardNameRow}
                          onLongPress={() => {
                            setEditingPlanId(sub.id);
                            setEditingPlanNames((p) => ({
                              ...p,
                              [sub.id]: displayName,
                            }));
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.planCardName} numberOfLines={1}>
                            {displayName}
                          </Text>
                          <Pencil size={12} color="#9CA3AF" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                      )}
                      <View
                        style={[
                          styles.planStatusBadge,
                          {
                            backgroundColor:
                              sub.status === "active" ? "#D1FAE5" : "#F3F4F6",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.planStatusDot,
                            {
                              backgroundColor:
                                sub.status === "active" ? "#10B981" : "#9CA3AF",
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.planStatusText,
                            {
                              color:
                                sub.status === "active" ? "#065F46" : "#6B7280",
                            },
                          ]}
                        >
                          {sub.status === "active" ? "Active" : sub.status}
                        </Text>
                      </View>
                    </View>

                    {/* Meal name */}
                    {mealForPlan && (
                      <Text style={styles.planCardMealName} numberOfLines={1}>
                        🍽 {mealForPlan.name}
                      </Text>
                    )}

                    {/* Stats */}
                    <View style={styles.planCardStatsRow}>
                      <View style={styles.planCardStat}>
                        <Text style={[styles.planCardStatValue, { color: accentColor }]}>
                          {sub.duration}
                        </Text>
                        <Text style={styles.planCardStatLabel}>days</Text>
                      </View>
                      <View style={styles.planCardStatDivider} />
                      <View style={styles.planCardStat}>
                        <Text
                          style={[
                            styles.planCardStatValue,
                            { color: daysRemaining > 0 ? "#10B981" : "#EF4444" },
                          ]}
                        >
                          {daysRemaining}
                        </Text>
                        <Text style={styles.planCardStatLabel}>remaining</Text>
                      </View>
                      <View style={styles.planCardStatDivider} />
                      <View style={styles.planCardStat}>
                        <Text
                          style={styles.planCardStatValue}
                          numberOfLines={1}
                        >
                          {sub.deliveryTimeSlot || sub.deliveryTime || "–"}
                        </Text>
                        <Text style={styles.planCardStatLabel}>slot</Text>
                      </View>
                    </View>

                    {/* Date range */}
                    <Text style={styles.planCardDateRange}>
                      {new Date(sub.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      →{" "}
                      {new Date(sub.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyPlansContainer}>
            <Package size={52} color="#D1D5DB" />
            <Text style={styles.emptyPlansTitle}>No Active Plans</Text>
            <Text style={styles.emptyPlansText}>
              Subscribe to a meal plan to start tracking deliveries
            </Text>
          </View>
        )}

        {/* ── Calendar ─────────────────────────────────────────────── */}
        {selectedPlanId && (
          <>
            {/* Legend + Navigation */}
            <View style={styles.calendarSection}>
              <View style={styles.calendarNav}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateMonth("prev")}
                >
                  <ChevronLeft size={20} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.monthYear}>
                  {currentDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateMonth("next")}
                >
                  <ChevronRight size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Legend */}
              <View style={styles.legendRow}>
                {[
                  { color: "#10B981", label: "Delivered" },
                  { color: "#48479B", label: "Upcoming" },
                  { color: "#F59E0B", label: "Weekend" },
                  { color: "#6B7280", label: "Skipped" },
                ].map((l) => (
                  <View key={l.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                    <Text style={styles.legendText}>{l.label}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={styles.calendar}>
                <View style={styles.dayHeaders}>
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                    (day) => (
                      <Text key={day} style={styles.dayHeader}>
                        {day}
                      </Text>
                    )
                  )}
                </View>
                <View style={styles.calendarGrid}>
                  {calendarDays.map(renderCalendarDay)}
                </View>
              </View>
            </View>

            {/* ── Selected Date Delivery Card ───────────────────────── */}
            <View style={styles.selectedDateSection}>
              <View style={styles.selectedDateHeader}>
                <View>
                  <Text style={styles.selectedDateTitle}>
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </Text>
                  <Text style={styles.selectedDateWeekday}>
                    {selectedDate.toLocaleDateString("en-US", { year: "numeric" })}
                  </Text>
                </View>
                {selectedDateDelivery && selectedDateDelivery.status !== "scheduled" && (
                  <View
                    style={[
                      styles.selectedDateBadge,
                      {
                        backgroundColor:
                          getDeliveryStatusColor(selectedDateDelivery.status) + "22",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectedDateBadgeText,
                        { color: getDeliveryStatusColor(selectedDateDelivery.status) },
                      ]}
                    >
                      {getDeliveryStatusLabel(selectedDateDelivery.status)}
                    </Text>
                  </View>
                )}
              </View>

              {renderSelectedDateDelivery()}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add-On Selection Modal – bottom-sheet style */}
      <Modal
        visible={showAddOnModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddOnModal(false)}
        statusBarTranslucent
      >
        <View style={styles.addonSheetOverlay}>
          {/* Backdrop */}
          <TouchableOpacity
            style={styles.addonSheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddOnModal(false)}
          />

          {/* Close Button – centred above sheet */}
          <TouchableOpacity
            style={styles.addonSheetCloseBtn}
            onPress={() => setShowAddOnModal(false)}
            activeOpacity={0.8}
          >
            <X size={22} color="#fff" />
          </TouchableOpacity>

          {/* Sheet */}
          <View style={styles.addonSheet}>
            {/* Header */}
            <View style={styles.addonSheetHeader}>
              <View style={styles.addonSheetHeaderIcon}>
                <Text style={{ fontSize: 26 }}>🍱</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addonSheetTitle}>
                  Add Items{" "}
                  <Text style={{ color: "#6B7280", fontWeight: "600" }}>
                    ({availableAddOns.length})
                  </Text>
                </Text>
                <Text style={styles.addonSheetSubtitle}>
                  {selectedDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>

            {/* Add-on list */}
            <ScrollView
              style={styles.addonSheetScroll}
              contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {availableAddOns.map((item) => {
                const selected = selectedAddOns.includes(item.id);
                return (
                  <View
                    key={item.id}
                    style={[styles.addonCard, selected && styles.addonCardSelected]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addonCardName}>{item.name}</Text>
                      <Text style={styles.addonCardDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                      <Text style={styles.addonCardPrice}>₹{item.price}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addonToggleBtn,
                        selected && styles.addonToggleBtnRemove,
                      ]}
                      onPress={() => handleAddOnSelection(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.addonToggleBtnText,
                          selected && { color: "#fff" },
                        ]}
                      >
                        {selected ? "Remove" : "Add"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            {/* Footer */}
            <View style={styles.addonSheetFooter}>
              {/* Summary row */}
              <View style={styles.addonSummaryRow}>
                <Text style={styles.addonSummaryLabel}>
                  {selectedAddOns.length > 0
                    ? `${selectedAddOns.length} item${selectedAddOns.length > 1 ? "s" : ""} selected`
                    : "No items selected"}
                </Text>
                <Text style={styles.addonSummaryTotal}>
                  ₹{getSelectedAddOnsTotal()}
                </Text>
              </View>

              {/* Payment buttons */}
              {selectedAddOns.length > 0 && (() => {
                const total = getSelectedAddOnsTotal();
                const walletBal = user?.walletBalance ?? 0;
                const canUseWallet = walletBal >= total;
                return (
                  <View style={styles.addonPaymentRow}>
                    {/* Wallet button */}
                    <TouchableOpacity
                      style={[
                        styles.addonPayBtn,
                        styles.addonPayBtnWallet,
                        !canUseWallet && styles.addonPayBtnDisabled,
                      ]}
                      onPress={handleWalletPayment}
                      disabled={!canUseWallet}
                      activeOpacity={0.8}
                    >
                      <Wallet
                        size={16}
                        color={canUseWallet ? "#fff" : "#9CA3AF"}
                      />
                      <View style={{ marginLeft: 6 }}>
                        <Text
                          style={[
                            styles.addonPayBtnLabel,
                            !canUseWallet && styles.addonPayBtnLabelDisabled,
                          ]}
                        >
                          Pay with Wallet
                        </Text>
                        <Text
                          style={[
                            styles.addonPayBtnSub,
                            !canUseWallet && { color: "#EF4444" },
                          ]}
                        >
                          {canUseWallet
                            ? `Balance: ₹${walletBal.toFixed(0)}`
                            : `Low balance: ₹${walletBal.toFixed(0)}`}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Razorpay button */}
                    <TouchableOpacity
                      style={[styles.addonPayBtn, styles.addonPayBtnRazorpay]}
                      onPress={handleConfirmAddOns}
                      activeOpacity={0.8}
                    >
                      <CreditCard size={16} color="#fff" />
                      <View style={{ marginLeft: 6 }}>
                        <Text style={styles.addonPayBtnLabel}>
                          UPI / Card
                        </Text>
                        <Text style={styles.addonPayBtnSub}>
                          Net Banking
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal for Add-ons */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            {paymentStatus === "processing" && (
              <>
                <Text style={styles.modalTitle}>Processing Payment</Text>
                <Text style={styles.modalSubtitle}>
                  Processing your payment...
                </Text>
              </>
            )}
            {paymentStatus === "success" && (
              <>
                <Text style={styles.modalTitle}>Payment Successful</Text>
                <Text style={styles.modalSubtitle}>
                  Add-ons have been scheduled.
                </Text>
              </>
            )}
            {paymentStatus === "failed" && (
              <>
                <Text style={styles.modalTitle}>Payment Failed</Text>
                <Text style={styles.modalSubtitle}>Please try again.</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleConfirmAddOns}
                    testID="retry-addon-payment"
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowPaymentModal(false);
                      setPaymentStatus(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* WhatsApp Button */}
      <TouchableOpacity style={styles.whatsappButton}>
        <Text style={styles.whatsappButtonText}>💬</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },
  scrollView: {
    flex: 1,
  },
  // ── New screen header ──────────────────────────────────────────────
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  screenHeaderText: {
    flex: 1,
  },
  screenHeaderTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  screenHeaderSub: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 1,
  },
  // ── Active Plans section ───────────────────────────────────────────
  plansSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
  plansSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  planCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardSelected: {
    shadowOpacity: 0.14,
    elevation: 6,
  },
  planCardAccent: {
    width: 5,
    alignSelf: "stretch",
  },
  planCardBody: {
    flex: 1,
    padding: 14,
  },
  planCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  planCardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  planCardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  planCardNameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    borderBottomWidth: 1.5,
    borderBottomColor: "#48479B",
    paddingVertical: 2,
    marginRight: 8,
  },
  planStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  planStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  planStatusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  planCardMealName: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
    fontWeight: "500",
  },
  planCardStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  planCardStat: {
    flex: 1,
    alignItems: "center",
  },
  planCardStatValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  planCardStatLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  planCardStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  planCardDateRange: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  emptyPlansContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyPlansTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPlansText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  // ── Calendar section ───────────────────────────────────────────────
  calendarSection: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  calendarNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 12,
  },
  // ── Selected date section ──────────────────────────────────────────
  selectedDateSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  // ── Rich delivery card ─────────────────────────────────────────────
  richDeliveryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 5,
  },
  richStatusStripe: {
    width: 5,
    alignSelf: "stretch",
  },
  richCardBody: {
    flex: 1,
    padding: 16,
  },
  richCardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  richMealImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
  richMealImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  richMealInfo: {
    flex: 1,
  },
  richMealName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 22,
  },
  richTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  richDeliveryTime: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  richCustomerName: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  richStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    alignSelf: "flex-start",
    minWidth: 80,
  },
  richStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  richStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  richAddOnsSection: {
    marginBottom: 10,
  },
  richAddOnsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  richAddOnsScroll: {
    flexGrow: 0,
  },
  richAddOnChip: {
    alignItems: "center",
    marginRight: 10,
    width: 64,
  },
  richAddOnImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginBottom: 4,
  },
  richAddOnImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  richAddOnName: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "600",
    textAlign: "center",
  },
  richStaffRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  richStaffItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  richStaffText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  richActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  richSkipBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
    gap: 6,
  },
  richSkipBtnText: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "700",
  },
  richAddBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#48479B",
    gap: 6,
  },
  richAddBtnText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
  },
  richBtnDisabled: {
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  richDisabledNote: {
    flex: 1,
    backgroundColor: "#FEF3C7",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  richDisabledNoteText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "500",
    textAlign: "center",
  },
  // ── Old header styles kept for backward compatibility ──────────────
  header: {
    backgroundColor: "#48479B",
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "white",
    marginLeft: 10,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "500",
  },
  legend: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  legendItems: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  monthYearContainer: {
    alignItems: "center",
  },
  monthYear: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  monthSubtext: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  calendar: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderRadius: 12,
    marginVertical: 2,
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDaySelected: {
    backgroundColor: "#48479B",
    transform: [{ scale: 1.1 }],
    shadowColor: "#48479B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  calendarDayToday: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  calendarDayWithDelivery: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  calendarDayTextInactive: {
    color: "#9CA3AF",
  },
  calendarDayTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  calendarDayTextToday: {
    color: "white",
    fontWeight: "bold",
  },
  deliveryIndicator: {
    position: "absolute",
    bottom: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "white",
  },
  todayIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
  },
  selectedDateContainer: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  selectedDateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  selectedDateTitleContainer: {
    flex: 1,
  },
  selectedDateTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  selectedDateWeekday: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  selectedDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  selectedDateBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  deliveryContainer: {
    padding: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  mealInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  mealImagePlaceholder: {
    fontSize: 24,
  },
  mealDetails: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },
  deliveryStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryStatusText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 14,
    color: "#6B7280",
  },
  addOnsContainer: {
    marginBottom: 12,
    marginTop: 8,
  },
  addOnsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  addOnsListContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  addOnChip: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  addOnChipText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "700",
  },
  addOnsText: {
    fontSize: 14,
    color: "#6B7280",
  },
  trackingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  trackingText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  deliveryActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  skipButtonText: {
    fontSize: 14,
    color: "#EF4444",
    marginLeft: 6,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#48479B",
    backgroundColor: "#EEF2FF",
    flex: 1,
    marginLeft: 8,
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 14,
    color: "#48479B",
    marginLeft: 6,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
    opacity: 0.6,
  },
  buttonTextDisabled: {
    color: "#9CA3AF",
  },
  disabledActionInfo: {
    flex: 1,
    backgroundColor: "#FEF3C7",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  disabledActionText: {
    fontSize: 12,
    color: "#92400E",
    textAlign: "center",
    fontWeight: "500",
  },
  debugInfo: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  debugText: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 2,
  },
  noDeliveryContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
    gap: 10,
  },
  noDeliveryText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#48479B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 4,
  },
  addProductButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  whatsappButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  whatsappButtonText: {
    fontSize: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: "#48479B",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  subscriptionInfo: {
    backgroundColor: "#EEF2FF",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  subscriptionText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  cutoffInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  cutoffText: {
    fontSize: 12,
    color: "#92400E",
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
  },
  addOnItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addOnItemSelected: {
    borderColor: "#48479B",
    backgroundColor: "#EEF2FF",
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  addOnDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  addOnPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
  },
  addOnCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  addOnCheckboxSelected: {
    backgroundColor: "#48479B",
    borderColor: "#48479B",
  },
  selectedSummary: {
    backgroundColor: "#EEF2FF",
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
  },
  selectedSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  selectedSummaryTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#48479B",
  },
  confirmButton: {
    backgroundColor: "#48479B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentModal: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    alignItems: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  /* removed duplicate modalTitle and modalSubtitle to avoid key conflicts */
  modalButtons: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#48479B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  planTabsContainer: {
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  planTabsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  planTabsScroll: {
    flexGrow: 0,
  },
  planTab: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    minWidth: 180,
  },
  planTabSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#48479B",
  },
  planTabHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  planTabName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 6,
  },
  planTabNameSelected: {
    color: "#48479B",
  },
  planTabDuration: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  planTabDurationSelected: {
    color: "#6B7280",
  },
  planTabStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  planTabStatusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  subscriptionTabs: {
    marginBottom: 16,
  },
  subscriptionTabsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  subscriptionTabsScroll: {
    flexGrow: 0,
  },
  subscriptionTab: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#48479B",
  },
  subscriptionTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#48479B",
    marginBottom: 2,
  },
  subscriptionTabDuration: {
    fontSize: 10,
    color: "#6B7280",
  },
  viewModeContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  viewModeToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  viewModeButtonActive: {
    backgroundColor: "#48479B",
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  viewModeButtonTextActive: {
    color: "white",
  },
  filterContainer: {
    backgroundColor: "white",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#48479B",
    borderColor: "#48479B",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "white",
  },
  ordersContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderCustomerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  orderPhone: {
    fontSize: 14,
    color: "#6B7280",
  },
  orderStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  orderMealInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  orderMealName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  orderDeliveryTime: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  orderAddOns: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  orderAddress: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  orderAddressText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
    flex: 1,
  },
  orderStaff: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  staffInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  staffText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  orderActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#48479B",
    marginLeft: 4,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    justifyContent: "center",
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    marginLeft: 4,
  },
  noOrdersContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  noOrdersTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  noOrdersText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  topBg: {
    width: "100%",
    paddingBottom: 0,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

  // ── Add-on bottom sheet ──────────────────────────────────────────────────
  addonSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  addonSheetBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  addonSheetCloseBtn: {
    alignSelf: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    zIndex: 10,
  },
  addonSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "72%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  addonSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 14,
  },
  addonSheetHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  addonSheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
  },
  addonSheetSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  addonSheetScroll: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  addonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addonCardSelected: {
    borderColor: "#48479B",
    backgroundColor: "#EEF2FF",
  },
  addonCardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  addonCardDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  addonCardPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#48479B",
  },
  addonToggleBtn: {
    backgroundColor: "#48479B",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 72,
    alignItems: "center",
    marginLeft: 10,
  },
  addonToggleBtnRemove: {
    backgroundColor: "#EF4444",
  },
  addonToggleBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  addonSheetFooter: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  addonSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addonSummaryLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  addonSummaryTotal: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  addonPaymentRow: {
    flexDirection: "row",
    gap: 10,
  },
  addonPayBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addonPayBtnWallet: {
    backgroundColor: "#10B981",
  },
  addonPayBtnRazorpay: {
    backgroundColor: "#48479B",
  },
  addonPayBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  addonPayBtnLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  addonPayBtnLabelDisabled: {
    color: "#9CA3AF",
  },
  addonPayBtnSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    marginTop: 1,
  },
});
