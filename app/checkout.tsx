import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
  Switch,
} from "react-native";
import AddressBookModal from "@/components/AddressBookModal";
import { Address, Offer } from "@/types";
import { Stack, router, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  MapPin,
  Tag,
  Check,
  CheckCircle,
  XCircle,
  FilterIcon,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import db from "@/db";
import { notifySubscriptionUpdate } from "@/utils/notificationTemplates";
import RazorpayCheckout from "react-native-razorpay";
import { Colors } from "@/constants/colors";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { addOns } from "@/constants/data";
import { StatusBar } from "expo-status-bar";
import { Filter } from "react-native-svg";
export default function CheckoutScreen() {
  const { user, isGuest, updateUser } = useAuth();
  const { locationState } = useLocation();
  const { subscriptionData } = useLocalSearchParams();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "upi" | "wallet" | "razorpay"
  >("razorpay");
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [applyWallet, setApplyWallet] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralApplying, setReferralApplying] = useState<boolean>(false);
  const [referralApplied, setReferralApplied] = useState<boolean>(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "processing" | "success" | "failed" | null
  >(null);
  const routerInstance = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressBook, setShowAddressBook] = useState<boolean>(false);
  // Delivery slot and start date states
  const [allTimeSlots, setAllTimeSlots] = useState<any[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Order for someone else
  const [orderForSomeoneElse, setOrderForSomeoneElse] =
    useState<boolean>(false);
  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientPhone, setRecipientPhone] = useState<string>("");

  React.useEffect(() => {
    setCanGoBack(routerInstance.canGoBack());
  }, []);

  useEffect(() => {
    if (subscriptionData && typeof subscriptionData === "string") {
      try {
        const parsedData = JSON.parse(subscriptionData);
        setSubscriptionDetails(parsedData);
        // Set start date and slot from params if available
        if (parsedData?.startDate) setStartDate(new Date(parsedData.startDate));
        if (parsedData?.timeSlot) setSelectedTimeSlot(parsedData.timeSlot);
      } catch (error) {
        console.error("Error parsing subscription data:", error);
        Alert.alert("Error", "Invalid subscription data");
        if (canGoBack) {
          router.back();
        } else {
          router.replace("/(tabs)");
        }
      }
    }
  }, [subscriptionData]);
  // Load delivery slots from db
  useEffect(() => {
    async function loadSlots() {
      try {
        const slots = await db.getTimeSlots();
        setAllTimeSlots((slots || []).filter((s: any) => s.isActive !== false));
        // If no slot selected, pick first
        if (!selectedTimeSlot && slots && slots.length > 0) {
          setSelectedTimeSlot(slots[0]);
        }
      } catch (e) {
        console.log("Error loading slots", e);
      }
    }
    loadSlots();
  }, []);

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      // If no address is currently selected, or if new addresses were added
      if (!selectedAddress) {
        const defaultAddress =
          user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
        setSelectedAddress(defaultAddress);
      } else {
        // Check if the current selected address still exists
        const currentAddressExists = user.addresses.find(
          (addr) => addr.id === selectedAddress.id
        );
        if (!currentAddressExists) {
          // If current address was deleted, select default or first
          const defaultAddress =
            user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
          setSelectedAddress(defaultAddress);
        }
      }
    } else if (user?.addresses && user.addresses.length === 0) {
      // No addresses available, clear selection
      setSelectedAddress(null);
    }
  }, [user?.addresses]);

  const walletBalance = user?.walletBalance ?? 0;

  const orderSummary = useMemo(() => {
    if (!subscriptionDetails) {
      return {
        planName: "",
        duration: 0,
        originalPrice: 0,
        discountedPrice: 0,
        discount: 0,
        deliveryFee: 0,
        promoDiscount: 0,
        trialDiscount: 0,
        addOnTotal: 0,
        walletAppliedAmount: 0,
        finalAmount: 0,
        payableAmount: 0,
        subtotalAfterPromo: 0,
      };
    }
    const planName: string = String(subscriptionDetails.plan?.name ?? "");
    const duration: number = Number(subscriptionDetails.plan?.duration ?? 0);
    const originalPrice: number = Number(
      subscriptionDetails.plan?.originalPrice ?? 0
    );
    const discountedPrice: number = Number(
      subscriptionDetails.plan?.discountedPrice ?? 0
    );
    const baseDiscount: number = Math.max(0, originalPrice - discountedPrice);
    const deliveryFee: number = 0;
    const trialDiscount: number = subscriptionDetails.isTrialMode
      ? discountedPrice * 0.5
      : 0;

    // Calculate addon total based on actual addon prices from data
    const addOnTotal: number = (subscriptionDetails.addOns ?? []).reduce(
      (total: number, addOnId: string) => {
        const addOn = addOns.find((a) => a.id === addOnId);
        return total + (addOn?.price ?? 0) * duration;
      },
      0
    );

    const baseSubtotal: number =
      discountedPrice + addOnTotal - trialDiscount + deliveryFee;
    let promoDiscount: number = 0;
    if (appliedOffer && promoApplied) {
      const benefitType = appliedOffer.benefitType ?? "amount";
      if (benefitType === "meal") {
        const days = duration > 0 ? duration : 1;
        const perMeal = days > 0 ? Math.round(discountedPrice / days) : 0;
        promoDiscount = Math.max(0, perMeal);
      } else {
        if (appliedOffer.discountType === "fixed") {
          promoDiscount = Math.min(appliedOffer.discountValue, baseSubtotal);
        } else if (appliedOffer.discountType === "percentage") {
          const pct = Math.max(0, Math.min(100, appliedOffer.discountValue));
          const raw = (baseSubtotal * pct) / 100;
          const capped =
            typeof appliedOffer.maxDiscount === "number"
              ? Math.min(raw, appliedOffer.maxDiscount)
              : raw;
          promoDiscount = Math.min(capped, baseSubtotal);
        }
      }
    }
    const subtotalAfterPromo: number = Math.max(
      0,
      baseSubtotal - promoDiscount
    );
    const walletAppliedAmount: number = applyWallet
      ? Math.min(walletBalance, subtotalAfterPromo)
      : 0;
    const payableAmount: number = Math.max(
      0,
      subtotalAfterPromo - walletAppliedAmount
    );
    return {
      planName,
      duration,
      originalPrice,
      discountedPrice,
      discount: baseDiscount,
      deliveryFee,
      promoDiscount,
      trialDiscount,
      addOnTotal,
      walletAppliedAmount,
      finalAmount: payableAmount,
      payableAmount,
      subtotalAfterPromo,
    };
  }, [
    subscriptionDetails,
    promoApplied,
    appliedOffer,
    applyWallet,
    walletBalance,
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setToastVisible(false);
        });
      }, 2200);
    });
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      Alert.alert("Enter Code", "Please enter a promo code.");
      return;
    }
    try {
      const active = await db.getActiveOffers();
      let merged: Offer[] = Array.isArray(active) ? active : [];
      try {
        const constants = await import("@/constants/data");
        const constOffers: Offer[] = (constants as any).offers ?? [];
        const seen = new Set(merged.map((o) => o.id));
        constOffers.forEach((o) => {
          if (o && !seen.has(o.id)) {
            merged.push(o);
            seen.add(o.id);
          }
        });
      } catch (e) {
        console.log("Offer constants import failed", e);
      }
      const match = merged.find(
        (o) =>
          (o.promoCode ?? o.code ?? "").toUpperCase() === code && o.isActive
      );
      if (!match) {
        Alert.alert("Invalid Code", "Please enter a valid promo code.");
        return;
      }
      const now = new Date();
      if (new Date(match.validFrom) > now || new Date(match.validTo) < now) {
        Alert.alert("Expired", "This promo code is not currently valid.");
        return;
      }
      setAppliedOffer(match);
      setPromoApplied(true);
      showToast("Promo applied successfully.");
    } catch (e) {
      console.log("Apply promo failed", e);
      Alert.alert("Error", "Could not validate promo code. Try again.");
    }
  };

  /**
   * Calculate subscription end date based on start date, duration, and week type
   * 
   * Example: 6-day Mon-Fri plan starting Monday will end on next Monday (skipping weekend)
   * 
   * @param start - Subscription start date
   * @param durationDays - Number of delivery days (not calendar days)
   * @param weekType - Delivery schedule (mon-fri, mon-sat, or everyday)
   * @returns Calculated end date
   */
  const computeEndDate = (
    start: Date,
    durationDays: number,
    weekType: "mon-fri" | "mon-sat" | "everyday"
  ): Date => {
    const end = new Date(start);
    let served = 0;

    // Loop until we've counted enough delivery days
    while (served < durationDays) {
      const day = end.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

      // Determine if current day is a working/delivery day based on week type
      let isWorkingDay = false;
      if (weekType === "everyday") {
        isWorkingDay = true; // All 7 days
      } else if (weekType === "mon-fri") {
        isWorkingDay = day >= 1 && day <= 5; // Mon to Fri only
      } else if (weekType === "mon-sat") {
        isWorkingDay = day >= 1 && day <= 6; // Mon to Sat only
      }

      // Count this day if it's a delivery day
      if (isWorkingDay) {
        served += 1;
      }

      // Move to next day if we haven't served all meals yet
      if (served < durationDays) {
        end.setDate(end.getDate() + 1);
      }
    }

    return end;
  };

  const handleApplyReferral = async () => {
    if (!user?.id) {
      Alert.alert("Login required", "Please login to apply a referral code.");
      return;
    }
    if (!referralCode.trim()) {
      Alert.alert("Enter code", "Please enter a referral code to apply.");
      return;
    }
    try {
      setReferralApplying(true);
      const res = await db.applyReferralCode(
        user.id,
        referralCode.trim().toUpperCase()
      );
      if (res.success) {
        setReferralApplied(true);
        Alert.alert("Success", res.message);
      } else {
        Alert.alert("Failed", res.message);
      }
    } catch (e) {
      Alert.alert("Error", "Could not apply referral code. Please try again.");
    } finally {
      setReferralApplying(false);
    }
  };

  const createRazorpayOrderAndOpenCheckout = async (
    amount: number,
    description: string
  ) => {
    try {
      const envBase = process.env.EXPO_PUBLIC_RORK_API_BASE_URL as
        | string
        | undefined;
      const base =
        envBase && envBase.length > 0
          ? envBase
          : typeof window !== "undefined" && (window as any).location?.origin
          ? (window as any).location.origin
          : undefined;

      if (!base) {
        console.log(
          "[Razorpay] Missing base URL. EXPO_PUBLIC_RORK_API_BASE_URL not set and window.location.origin unavailable"
        );
        Alert.alert("Config error", "API base URL not configured");
        return null;
      }

      const customer = {
        name: user?.name ?? "Customer",
        email: user?.email ?? undefined,
        contact: user?.phone ?? undefined,
      } as { name: string; email?: string; contact?: string };

      const orderResp = await fetch(
        `${base}/api/payments/razorpay/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: { description },
          }),
        }
      );

      if (!orderResp.ok) {
        const t = await orderResp.text();
        console.log("[Razorpay] order create failed", orderResp.status, t);
        try {
          const json = JSON.parse(t);
          Alert.alert(
            "Payment error",
            json?.error
              ? String(json.error)
              : "Unable to start Razorpay checkout"
          );
        } catch {
          Alert.alert("Payment error", "Unable to start Razorpay checkout");
        }
        return null;
      }

      const order = (await orderResp.json()) as {
        id?: string;
        amount?: number;
      };
      if (!order?.id) {
        Alert.alert("Payment error", "Invalid order response from server");
        return null;
      }

      const checkoutUrl = `${base}/api/payments/razorpay/checkout?orderId=${encodeURIComponent(
        order.id
      )}&amount=${encodeURIComponent(
        String(order.amount ?? Math.round(amount * 100))
      )}&name=${encodeURIComponent(
        customer.name
      )}&description=${encodeURIComponent(
        description
      )}&email=${encodeURIComponent(
        customer.email ?? ""
      )}&contact=${encodeURIComponent(
        customer.contact ?? ""
      )}&themeColor=${encodeURIComponent("#48479B")}`;

      return checkoutUrl;
    } catch (e) {
      console.log("[Razorpay] order create exception", e);
      Alert.alert(
        "Payment error",
        "Something went wrong while initializing payment."
      );
      return null;
    }
  };

  const handlePlaceOrder = async () => {
    if (isGuest) {
      router.push("/auth/login");
      return;
    }

    // Check if location is serviceable
    if (!locationState.isLocationServiceable) {
      Alert.alert(
        "Area Not Serviceable",
        "We currently don't deliver to your location. We'll notify you when we expand to your area!",
        [
          {
            text: "Get Notified",
            onPress: () => router.push("/service-area-request"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    if (!selectedAddress) {
      Alert.alert(
        "Address Required",
        "Please select a delivery address to continue."
      );
      return;
    }

    // Validate recipient details if ordering for someone else
    if (orderForSomeoneElse) {
      if (!recipientName.trim()) {
        Alert.alert(
          "Recipient Name Required",
          "Please enter the recipient's name."
        );
        return;
      }
      if (!recipientPhone.trim() || recipientPhone.length !== 10) {
        Alert.alert(
          "Valid Phone Required",
          "Please enter a valid 10-digit phone number for the recipient."
        );
        return;
      }
    }

    if (selectedPaymentMethod === "wallet") {
      if (orderSummary.payableAmount > 0) {
        Alert.alert(
          "Insufficient Wallet Balance",
          "Remaining amount exists after wallet usage. Choose UPI/Card or apply more wallet."
        );
        return;
      }
    }

    // Always update subscriptionDetails with latest startDate and slot before payment
    const updatedDetails = {
      ...subscriptionDetails,
      startDate,
      timeSlot: selectedTimeSlot,
    };
    // If amount payable is zero, activate immediately
    if (orderSummary.payableAmount === 0) {
      setShowPaymentModal(true);
      setPaymentStatus("processing");
      setTimeout(async () => {
        setPaymentStatus("success");
        console.log("Deducting wallet --- IGNORE ---");
        if (user?.id && orderSummary.walletAppliedAmount > 0) {
          try {
            await db.addWalletTransaction({
              userId: user.id,
              type: "debit",
              amount: orderSummary.walletAppliedAmount,
              description: "Subscription payment (wallet applied)",
              referenceId: `sub-${Date.now()}`,
            });
            await updateUser({
              walletBalance: Math.max(
                0,
                walletBalance - orderSummary.walletAppliedAmount
              ),
            });
          } catch (e) {
            console.log("Wallet debit failed", e);
          }
        }

        console.log("PaymentStatus after wallet --- IGNORE ---");
        // Save subscription to database
        const startDateVal = new Date(updatedDetails.startDate);
        const endDate = computeEndDate(
          startDateVal,
          updatedDetails.plan.duration,
          updatedDetails.weekType
        );

        // Deduct wallet amount if applied (for zero-payment flow)
        if (user?.id && orderSummary.walletAppliedAmount > 0) {
          try {
            await db.addWalletTransaction({
              userId: user.id,
              type: "debit",
              amount: orderSummary.walletAppliedAmount,
              description: `Subscription payment - ${
                updatedDetails.meal?.name || "Meal"
              } (${updatedDetails.plan?.name || ""})`,
              referenceId: `sub-wallet-${Date.now()}`,
            });
            // Refresh user data to reflect new balance
            const refreshedUser = await db.getUserById(user.id);
            if (refreshedUser) {
              await updateUser({ walletBalance: refreshedUser.walletBalance });
            }
          } catch (e) {
            console.error("Wallet debit failed:", e);
            setPaymentStatus("failed");
            return;
          }
        }

        const subscription = {
          userId: user?.id || "guest",
          mealId: updatedDetails.meal.id,
          planId: updatedDetails.plan.id,
          startDate: startDateVal,
          endDate: endDate,
          deliveryTime: updatedDetails.timeSlot?.time,
          deliveryTimeSlot: updatedDetails.timeSlot?.time,
          weekType: updatedDetails.weekType,
          weekendExclusion:
            updatedDetails.weekType === "everyday"
              ? "none"
              : updatedDetails.weekType === "mon-sat"
                ? "sunday"
                : "both",
          excludeWeekends:
            updatedDetails.weekType === "everyday"
              ? false
              : updatedDetails.weekType === "mon-sat",
          status: "active" as const,
          totalAmount: orderSummary.finalAmount,
          paidAmount: orderSummary.finalAmount,
          remainingDeliveries: updatedDetails.plan.duration,
          totalDeliveries: updatedDetails.plan.duration,
          addressId: selectedAddress?.id || "default",
          addOns: updatedDetails.addOns ?? [],
          additionalAddOns: {},
          specialInstructions: deliveryInstructions,
          mealType: updatedDetails.mealType,
          // Recipient info if ordering for someone else
          recipientName: orderForSomeoneElse ? recipientName : null,
          recipientPhone: orderForSomeoneElse ? recipientPhone : null,
          orderForSomeoneElse: orderForSomeoneElse,
        };
        console.log("Creating subscription:", subscription);
        let createdSubscriptionId: string | undefined;
        try {
          const createdSubscription = await db.createSubscription(subscription);
          createdSubscriptionId = createdSubscription.id;
          console.log(
            "Subscription created successfully with ID:",
            createdSubscriptionId
          );

          // Notify via push + WhatsApp
          if (user?.id) {
            notifySubscriptionUpdate(
              { userId: user.id, name: user.name || "Customer", phone: user.phone || "", pushToken: user.pushToken },
              {
                planName: updatedDetails.plan?.name || "Meal Plan",
                status: "activated",
                startDate: new Date(updatedDetails.startDate).toLocaleDateString(),
                endDate: updatedDetails.endDate ? new Date(updatedDetails.endDate).toLocaleDateString() : undefined,
              }
            ).catch(() => {});
          }

          // Update wallet transaction with subscription ID if available
          if (
            createdSubscriptionId &&
            user?.id &&
            orderSummary.walletAppliedAmount > 0
          ) {
            try {
              // Add a more detailed wallet transaction with subscription reference
              await db.addWalletTransaction({
                userId: user.id,
                type: "debit",
                amount: orderSummary.walletAppliedAmount,
                description: `Subscription payment - ${
                  updatedDetails.meal?.name || "Meal"
                } (${updatedDetails.plan?.name || ""})`,
                referenceId: createdSubscriptionId,
                orderId: createdSubscriptionId,
              });
            } catch (e) {
              console.log(
                "Failed to update wallet transaction with subscription ID",
                e
              );
            }
          }
        } catch (error) {
          console.error("Error creating subscription:", error);
        }
        setTimeout(() => {
          setShowPaymentModal(false);
          // Wait for modal to close before navigating
          setTimeout(() => {
            if (router.dismiss) {
              router.dismiss();
            }
            router.replace("/(tabs)/orders");
          }, 100);
        }, 2000);
      }, 1500);
      return;
    }

    // Non-zero payment: create Razorpay order then open checkout bridge
    // const checkoutUrl = await createRazorpayOrderAndOpenCheckout(orderSummary.payableAmount, `Subscription payment for ${subscriptionDetails?.meal?.name ?? 'Meal'}`);
    // if (checkoutUrl) {
    //   router.push({ pathname: '/webview', params: { url: checkoutUrl, title: 'Complete Payment' } });
    // }
    const description = "Credits towards consultation";
    const payload = {
      amount: Math.round(orderSummary.payableAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { description },
    };

    console.log("Creating Razorpay order with payload:", payload);
    const orderResp = await fetch(
      "https://sameoldbox.com/wp-json/razorpay/v1/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    console.log("Created Razorpay order :", orderResp);

    if (!orderResp.ok) {
      alert("Failed to create Razorpay order");
      return;
    }
    const orderData = await orderResp.json();
    const razorpayKey =
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_test_RFSonKoJy6tEEL";
    const options = {
      description,
      image: "https://i.imgur.com/3g7nmJC.jpg",
      currency: "INR",
      key: razorpayKey, // Public Razorpay key (set EXPO_PUBLIC_RAZORPAY_KEY_ID for EAS builds)
      amount: `${orderSummary.payableAmount * 100}`,
      name: "SOB",
      order_id: orderData.id, // Use the order_id from backend
      prefill: {
        email: "gaurav.kumar@example.com",
        contact: "+919876543210",
        name: "Gaurav Kumar",
      },
      theme: { color: "#53a20e" },
    };

    console.log("Razorpay options:", options);
    RazorpayCheckout.open(options)
      .then(async (data: { razorpay_payment_id: string }) => {
        setShowPaymentModal(true);
        setPaymentStatus("success");

        // Save subscription to database
        const startDateVal = new Date(updatedDetails.startDate);
        const endDate = computeEndDate(
          startDateVal,
          updatedDetails.plan.duration,
          updatedDetails.weekType
        );

        const subscription = {
          userId: user?.id || "guest",
          mealId: updatedDetails.meal.id,
          planId: updatedDetails.plan.id,
          startDate: startDateVal,
          endDate: endDate,
          deliveryTime: updatedDetails.timeSlot?.time,
          deliveryTimeSlot: updatedDetails.timeSlot?.time,
          weekType: updatedDetails.weekType,
          weekendExclusion:
            updatedDetails.weekType === "everyday"
              ? "none"
              : updatedDetails.weekType === "mon-sat"
                ? "sunday"
                : "both",
          excludeWeekends:
            updatedDetails.weekType === "everyday"
              ? false
              : updatedDetails.weekType === "mon-sat",
          status: "active" as const,
          totalAmount: orderSummary.finalAmount,
          paidAmount: orderSummary.finalAmount,
          remainingDeliveries: updatedDetails.plan.duration,
          totalDeliveries: updatedDetails.plan.duration,
          addressId: selectedAddress?.id || "default",
          addOns: updatedDetails.addOns ?? [],
          additionalAddOns: {},
          specialInstructions: deliveryInstructions,
          mealType: updatedDetails.mealType,
          // Recipient info if ordering for someone else
          recipientName: orderForSomeoneElse ? recipientName : null,
          recipientPhone: orderForSomeoneElse ? recipientPhone : null,
          orderForSomeoneElse: orderForSomeoneElse,
        };
        console.log("Creating subscription:", subscription);

        let createdSubscriptionId: string | undefined;
        try {
          const createdSubscription = await db.createSubscription(subscription);
          createdSubscriptionId = createdSubscription.id;
          console.log("Subscription created with ID:", createdSubscriptionId);
          if (user?.id) {
            notifySubscriptionUpdate(
              { userId: user.id, name: user.name || "Customer", phone: user.phone || "", pushToken: user.pushToken },
              {
                planName: subscriptionDetails?.plan?.name || "Meal Plan",
                status: "activated",
                startDate: new Date(subscriptionDetails?.startDate || Date.now()).toLocaleDateString(),
              }
            ).catch(() => {});
          }
        } catch (error) {
          console.error("Error creating subscription:", error);
        }

        // Deduct wallet amount if applied and record transaction
        if (user?.id && orderSummary.walletAppliedAmount > 0) {
          try {
            await db.addWalletTransaction({
              userId: user.id,
              type: "debit",
              amount: orderSummary.walletAppliedAmount,
              description: `Subscription payment - ${
                updatedDetails.meal?.name || "Meal"
              } (${updatedDetails.plan?.name || ""})`,
              referenceId: createdSubscriptionId || `sub-${Date.now()}`,
              orderId: createdSubscriptionId,
            });
            // The addWalletTransaction method now handles user balance update internally
            // Refresh user data to reflect new balance
            const refreshedUser = await db.getUserById(user.id);
            if (refreshedUser) {
              await updateUser({ walletBalance: refreshedUser.walletBalance });
            }
          } catch (e) {
            console.error("Wallet debit failed:", e);
            // Show error but don't block subscription creation
            Alert.alert(
              "Wallet Error",
              "There was an issue processing your wallet payment. Please contact support."
            );
          }
        }

        // Trigger WhatsApp confirmation (production would integrate with WhatsApp Business API)
        console.log(
          `[WhatsApp] Sending confirmation to ${user?.phone || recipientPhone} for subscription ${createdSubscriptionId}`
        );

        // Close modal and navigate
        setShowPaymentModal(false);
        setTimeout(() => {
          router.replace("/(tabs)");
          setTimeout(() => {
            router.replace("/(tabs)/orders");
          }, 100);
        }, 100);
      })
      .catch((error: any) => {
        console.log("Razorpay error:", error);
        alert(`Error: ${error.code} | ${error.description}`);
      });
  };

  const retryPayment = async () => {
    setPaymentStatus("processing");
    setTimeout(async () => {
      if (selectedPaymentMethod === "wallet" && user?.id) {
        try {
          await db.addWalletTransaction({
            userId: user.id,
            type: "debit",
            amount: orderSummary.finalAmount,
            description: "Subscription payment (retry)",
            referenceId: `sub-${Date.now()}`,
          });
          await updateUser({
            walletBalance: Math.max(
              0,
              walletBalance - orderSummary.finalAmount
            ),
          });
        } catch (e) {
          console.log("Wallet debit failed (retry)", e);
        }
      }

      // Save subscription on retry as well
      const startDate = new Date(subscriptionDetails.startDate);
      const endDate = computeEndDate(
        startDate,
        subscriptionDetails.plan.duration,
        subscriptionDetails.weekType
      );

      const subscription = {
        userId: user?.id || "guest",
        mealId: subscriptionDetails.meal.id,
        planId: subscriptionDetails.plan.id,
        startDate: startDate,
        endDate: endDate,
        deliveryTime: subscriptionDetails.timeSlot.time,
        deliveryTimeSlot: subscriptionDetails.timeSlot.time,
        weekType: subscriptionDetails.weekType,
        excludeWeekends:
          subscriptionDetails.weekType === "everyday"
            ? false
            : subscriptionDetails.weekType === "mon-sat",
        weekendExclusion:
          subscriptionDetails.weekType === "everyday"
            ? "none"
            : subscriptionDetails.weekType === "mon-sat"
              ? "sunday"
              : "both",
        status: "active" as const,
        totalAmount: orderSummary.finalAmount,
        paidAmount: orderSummary.finalAmount,
        remainingDeliveries: subscriptionDetails.plan.duration,
        totalDeliveries: subscriptionDetails.plan.duration,
        addressId: selectedAddress?.id || "default",
        addOns: subscriptionDetails.addOns ?? [],
        additionalAddOns: {},
        specialInstructions: deliveryInstructions,
        mealType: subscriptionDetails.mealType,
        // Recipient info if ordering for someone else
        recipientName: orderForSomeoneElse ? recipientName : null,
        recipientPhone: orderForSomeoneElse ? recipientPhone : null,
        orderForSomeoneElse: orderForSomeoneElse,
      };

      try {
        await db.createSubscription(subscription);
        console.log("Subscription created successfully on retry");
        if (user?.id) {
          notifySubscriptionUpdate(
            { userId: user.id, name: user.name || "Customer", phone: user.phone || "", pushToken: user.pushToken },
            {
              planName: subscriptionDetails?.plan?.name || "Meal Plan",
              status: "activated",
              startDate: new Date(subscriptionDetails?.startDate || Date.now()).toLocaleDateString(),
            }
          ).catch(() => {});
        }
      } catch (error) {
        console.error("Error creating subscription on retry:", error);
      }

      setPaymentStatus("success");
      setTimeout(() => {
        setShowPaymentModal(false);
        router.push("/(tabs)");
      }, 2000);
    }, 2000);
  };

  const insets = useSafeAreaInsets();

  return (
     
      <SafeAreaView style={[styles.container]} edges={["top"]}>
        <Stack.Screen
        options={{
          title: "Checkout",
          headerShown: true,
          headerStyle: { backgroundColor: Colors.primary  },
          headerTitleStyle: {
            color: Colors.background,
            fontSize: 18,
            fontWeight: "700",
            
          },
          headerLeft: () => (
            <View style={{ marginLeft: 18, marginRight: 9 }}>
              <TouchableOpacity
                onPress={() => router.push("/")}
                testID="open-filter"
              >
                <ArrowLeft size={24} color={Colors.background} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Stack.Screen options={{ headerShown: false }} />
      
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ArrowLeft size={24} color={Colors.text} />
                 <Text style={styles.headerTitle}>Checkout</Text>
              </TouchableOpacity>
             
              <TouchableOpacity
                onPress={() => {}}
              >
                {/* <FilterIcon size={24} color={Colors.text} /> */}
              </TouchableOpacity>
            </View>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          
          {!subscriptionDetails ? (
            <View style={styles.loadingContainer}>
              <Text>Loading...</Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                {selectedAddress ? (
                  <TouchableOpacity
                    style={styles.addressCard}
                    onPress={() => setShowAddressBook(true)}
                  >
                    <View style={styles.addressIconContainer}>
                      <MapPin size={20} color="#48479B" />
                    </View>
                    <View style={styles.addressContent}>
                      <View style={styles.addressHeader}>
                        <Text style={styles.addressLabel}>
                          {selectedAddress.label}
                        </Text>
                        {selectedAddress.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressName}>
                        {selectedAddress.name}
                      </Text>
                      <Text style={styles.addressText}>
                        {selectedAddress.addressLine}
                      </Text>
                      <Text style={styles.addressSubtext}>
                        {selectedAddress.city}, {selectedAddress.state} -{" "}
                        {selectedAddress.pincode}
                      </Text>
                    </View>
                    <View style={styles.addressActions}>
                      <Text style={styles.changeButtonText}>Change</Text>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.addAddressCard}
                    onPress={() => setShowAddressBook(true)}
                  >
                    <View style={styles.addAddressIconContainer}>
                      <MapPin size={24} color="#48479B" />
                    </View>
                    <View style={styles.addressContent}>
                      <Text style={styles.addAddressText}>
                        Add Delivery Address
                      </Text>
                      <Text style={styles.addAddressSubtext}>
                        Please add an address to continue with your order
                      </Text>
                    </View>
                    <View style={styles.addressActions}>
                      <Text style={styles.addButtonText}>Add</Text>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      {subscriptionDetails.meal?.name}
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₹{subscriptionDetails.meal?.price}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      {orderSummary.planName} ({orderSummary.duration} days)
                    </Text>
                    <Text style={styles.summaryValue}>
                      ₹{orderSummary.originalPrice}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Plan Discount</Text>
                    <Text style={styles.discountValue}>
                      -₹{orderSummary.discount}
                    </Text>
                  </View>
                  {subscriptionDetails.isTrialMode && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>
                        Trial Discount (50%)
                      </Text>
                      <Text style={styles.discountValue}>
                        -₹{orderSummary.trialDiscount}
                      </Text>
                    </View>
                  )}
                  {(subscriptionDetails.addOns?.length ?? 0) > 0 && (
                    <>
                      <View style={styles.summaryRow}>
                        <Text
                          style={[
                            styles.summaryLabel,
                            { fontWeight: "600", marginTop: 8 },
                          ]}
                        >
                          Add-ons
                        </Text>
                      </View>
                      {(subscriptionDetails.addOns ?? []).map(
                        (addOnId: string) => {
                          const addOn = addOns.find((a) => a.id === addOnId);
                          if (!addOn) return null;
                          const addOnPrice =
                            addOn.price * orderSummary.duration;
                          return (
                            <View
                              key={addOnId}
                              style={[styles.summaryRow, { paddingLeft: 16 }]}
                            >
                              <Text
                                style={[
                                  styles.summaryLabel,
                                  { fontSize: 14, color: "#666" },
                                ]}
                              >
                                • {addOn.name} x {orderSummary.duration} days
                              </Text>
                              <Text
                                style={[styles.summaryValue, { fontSize: 14 }]}
                              >
                                ₹{addOnPrice}
                              </Text>
                            </View>
                          );
                        }
                      )}
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Add-ons Total</Text>
                        <Text style={styles.summaryValue}>
                          ₹{orderSummary.addOnTotal}
                        </Text>
                      </View>
                    </>
                  )}
                  {promoApplied && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>
                        Promo Discount (
                        {appliedOffer?.promoCode ??
                          appliedOffer?.code ??
                          promoCode}
                        )
                      </Text>
                      <Text style={styles.discountValue}>
                        -₹{orderSummary.promoDiscount}
                      </Text>
                    </View>
                  )}
                  {applyWallet && orderSummary.walletAppliedAmount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Wallet Used</Text>
                      <Text style={styles.discountValue}>
                        -₹{orderSummary.walletAppliedAmount}
                      </Text>
                    </View>
                  )}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.freeText}>FREE</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>
                      ₹{orderSummary.finalAmount}
                    </Text>
                  </View>
                </View>
              </View>
              {/* Delivery Slot Selection (EXACT MATCH + DEBUG) */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Time</Text>
                <View style={styles.timeSlotContainer}>
                  {allTimeSlots
                    .filter(
                      (s) =>
                        !subscriptionDetails?.meal?.availableTimeSlotIds ||
                        subscriptionDetails.meal.availableTimeSlotIds.length ===
                          0 ||
                        subscriptionDetails.meal.availableTimeSlotIds.includes(
                          s.id
                        )
                    )
                    .map((slot) => {
                      const isSelected = selectedTimeSlot?.id === slot.id;
                      return (
                        <TouchableOpacity
                          key={slot.id}
                          style={[
                            styles.timeSlotButton,
                            isSelected && styles.selectedTimeSlot,
                          ]}
                          onPress={() => {
                            setSelectedTimeSlot(slot);
                            console.log(
                              "[CHECKOUT] Selected delivery slot:",
                              slot
                            );
                          }}
                        >
                          {/* Use same icon as meal id */}
                          <Text
                            style={[
                              styles.timeSlotText,
                              isSelected && styles.selectedTimeSlotText,
                            ]}
                          >
                            {slot.time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
                {/* <Text style={{ fontSize: 12, color: "#666" }}>
                  DEBUG: selectedTimeSlot = {JSON.stringify(selectedTimeSlot)}
                </Text> */}
              </View>
              {/* Start Date Selection (EXACT MATCH + DEBUG) */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => {
                    setShowDatePicker(true);
                    console.log(
                      "[CHECKOUT] Opened date picker, current startDate:",
                      startDate
                    );
                  }}
                >
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text style={styles.dateValue}>
                    {startDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
                {/* <Text style={{ fontSize: 12, color: "#666" }}>
                  DEBUG: startDate = {startDate.toISOString()}
                </Text> */}
              </View>

              {/* Order for Someone Else Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Order for Someone Else?
                  </Text>
                  <Switch
                    value={orderForSomeoneElse}
                    onValueChange={setOrderForSomeoneElse}
                    trackColor={{ false: "#D1D5DB", true: "#A3D397" }}
                    thumbColor={orderForSomeoneElse ? "#48479B" : "#f4f3f4"}
                  />
                </View>
                {orderForSomeoneElse && (
                  <View style={styles.recipientForm}>
                    <TextInput
                      style={styles.input}
                      placeholder="Recipient Name *"
                      value={recipientName}
                      onChangeText={setRecipientName}
                      placeholderTextColor="#999"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Recipient Phone *"
                      value={recipientPhone}
                      onChangeText={setRecipientPhone}
                      keyboardType="phone-pad"
                      placeholderTextColor="#999"
                      maxLength={10}
                    />
                    <Text style={styles.recipientNote}>
                      📱 The recipient will receive order updates on this number
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Promo Code</Text>
                <View style={styles.promoContainer}>
                  <View style={styles.promoInputContainer}>
                    <Tag size={20} color="#666" />
                    <TextInput
                      style={styles.promoInput}
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChangeText={setPromoCode}
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      promoApplied && styles.appliedButton,
                    ]}
                    onPress={handleApplyPromo}
                    disabled={promoApplied}
                  >
                    {promoApplied ? (
                      <Check size={16} color="white" />
                    ) : (
                      <Text style={styles.applyButtonText}>Apply</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Referral Code</Text>
                <View style={styles.promoContainer}>
                  <View style={styles.promoInputContainer}>
                    <Tag size={20} color="#666" />
                    <TextInput
                      style={styles.promoInput}
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChangeText={setReferralCode}
                      autoCapitalize="characters"
                      testID="referral-input"
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      (referralApplied || referralApplying) &&
                        styles.appliedButton,
                    ]}
                    onPress={handleApplyReferral}
                    disabled={referralApplied || referralApplying}
                    testID="referral-apply"
                  >
                    {referralApplied ? (
                      <Check size={16} color="white" />
                    ) : referralApplying ? (
                      <Text style={styles.applyButtonText}>Applying...</Text>
                    ) : (
                      <Text style={styles.applyButtonText}>Apply</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
                  Both you and your friend get ₹200 in wallet on successful
                  referral.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Use Wallet</Text>
                <TouchableOpacity
                  style={[
                    styles.walletRow,
                    applyWallet && styles.walletRowActive,
                  ]}
                  onPress={() => {
                    const next = !applyWallet;
                    setApplyWallet(next);
                    if (next) {
                      const saveAmt = Math.min(
                        walletBalance,
                        orderSummary.subtotalAfterPromo
                      );
                      showToast(`Wallet applied. You saved ₹${saveAmt}.`);
                    }
                  }}
                  testID="wallet-apply"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: applyWallet }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      applyWallet && styles.checkboxChecked,
                    ]}
                  >
                    {applyWallet && <Check size={16} color="#fff" />}
                  </View>
                  <View style={styles.walletContent}>
                    <Text style={styles.walletTitle}>Use wallet balance</Text>
                    <Text style={styles.walletSub}>
                      Available: ₹{walletBalance}
                    </Text>
                  </View>
                  {applyWallet && orderSummary.walletAppliedAmount > 0 && (
                    <Text style={styles.walletAppliedText}>
                      -₹{orderSummary.walletAppliedAmount}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Payment methods removed: redirecting directly to Razorpay on pay */}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Delivery Instructions (Optional)
                </Text>
                <TextInput
                  style={styles.instructionsInput}
                  placeholder="e.g., Leave at the door, Ring the bell twice"
                  value={deliveryInstructions}
                  onChangeText={setDeliveryInstructions}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.bottomSpacing} />
            </>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomContainer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>
              Payable: ₹{orderSummary.payableAmount}
            </Text>
            <Text style={styles.savingsText}>
              You save ₹
              {orderSummary.discount +
                orderSummary.promoDiscount +
                orderSummary.trialDiscount}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              !locationState.isLocationServiceable && styles.placeOrderButtonDisabled,
            ]}
            onPress={handlePlaceOrder}
            disabled={!locationState.isLocationServiceable}
          >
            <Text style={styles.placeOrderButtonText}>
              {!locationState.isLocationServiceable
                ? "Area Not Serviceable"
                : isGuest
                ? "Login & Place Order"
                : orderSummary.payableAmount === 0
                ? "Activate Now"
                : "Pay Now"}
            </Text>
          </TouchableOpacity>
          {!locationState.isLocationServiceable && (
            <TouchableOpacity
              style={styles.serviceabilityNote}
              onPress={() => router.push("/service-area-request")}
            >
              <Text style={styles.serviceabilityNoteText}>
                We don't deliver to your location yet. 
              </Text>
              <Text style={styles.serviceabilityLink}>
                Get notified when we expand →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date Picker Modal (EXACT MATCH + DEBUG) */}
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
                onPress={() => {
                  setShowDatePicker(false);
                  console.log(
                    "[CHECKOUT] Closed date picker, startDate:",
                    startDate
                  );
                }}
              >
                <Text style={{ fontSize: 24 }}>×</Text>
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
                    console.log(
                      "[CHECKOUT] Picked startDate: Today",
                      new Date()
                    );
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
                        console.log(
                          "[CHECKOUT] Picked startDate: Tomorrow",
                          tomorrow
                        );
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
                        startDate.toDateString() ===
                          futureDate.toDateString() &&
                          styles.selectedDateOption,
                      ]}
                      onPress={() => {
                        setStartDate(futureDate);
                        setShowDatePicker(false);
                        console.log(
                          "[CHECKOUT] Picked startDate: Future",
                          futureDate
                        );
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
                      {startDate.toDateString() ===
                        futureDate.toDateString() && (
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
              {/* <Text style={{ fontSize: 12, color: "#666", marginTop: 12 }}>
                DEBUG: startDate = {startDate.toISOString()}
              </Text> */}
            </ScrollView>
          </SafeAreaView>
        </Modal>
        {/* Payment Modal */}
        <Modal
          visible={showPaymentModal}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.paymentModal}>
              {paymentStatus === "processing" && (
                <>
                  <View style={styles.processingIcon}>
                    <Text style={styles.processingText}>💳</Text>
                  </View>
                  <Text style={styles.modalTitle}>Processing Payment</Text>
                  <Text style={styles.modalSubtitle}>
                    Please wait while we process your payment...
                  </Text>
                </>
              )}

              {paymentStatus === "success" && (
                <>
                  <CheckCircle size={60} color="#10B981" />
                  <Text style={styles.modalTitle}>Payment Successful!</Text>
                  <Text style={styles.modalSubtitle}>
                    Your subscription has been activated. You will receive a
                    confirmation on WhatsApp.
                  </Text>
                  {orderSummary.walletAppliedAmount > 0 && (
                    <Text
                      style={[
                        styles.modalSubtitle,
                        { color: "#10B981", marginTop: 8 },
                      ]}
                    >
                      Wallet used: ₹{orderSummary.walletAppliedAmount}
                    </Text>
                  )}
                  {promoApplied && (
                    <Text
                      style={[
                        styles.modalSubtitle,
                        { color: "#10B981", marginTop: 4 },
                      ]}
                    >
                      Promo saved: ₹{orderSummary.promoDiscount}
                    </Text>
                  )}
                </>
              )}

              {paymentStatus === "failed" && (
                <>
                  <XCircle size={60} color="#EF4444" />
                  <Text style={styles.modalTitle}>Payment Failed</Text>
                  <Text style={styles.modalSubtitle}>
                    There was an issue processing your payment. Please try
                    again.
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={retryPayment}
                    >
                      <Text style={styles.retryButtonText}>Retry Payment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowPaymentModal(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {toastVisible && (
          <Animated.View
            style={[
              styles.toast,
              {
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [80, 0],
                    }),
                  },
                ],
                opacity: toastAnim,
              },
            ]}
            testID="toast"
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}

        <AddressBookModal
          visible={showAddressBook}
          onClose={() => setShowAddressBook(false)}
          onSelectAddress={(address) => {
            setSelectedAddress(address);
            setShowAddressBook(false);
          }}
          showSelectMode={true}
        />
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
  backButton: {
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recipientForm: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  recipientNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  addressCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  addressContent: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  addressSubtext: {
    fontSize: 14,
    color: "#666",
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#48479B",
  },
  changeButtonText: {
    color: "#48479B",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#333",
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  discountValue: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  freeText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#E53935",
  },
  promoContainer: {
    flexDirection: "row",
    gap: 12,
  },
  promoInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  promoInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  applyButton: {
    backgroundColor: "#48479B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  appliedButton: {
    backgroundColor: "#10B981",
  },
  applyButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedPaymentMethod: {
    borderColor: "#E53935",
    backgroundColor: "#FEF2F2",
  },
  walletRow: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  walletRowActive: {
    borderColor: "#E53935",
    backgroundColor: "#FEF2F2",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#48479B",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: "#48479B",
  },
  walletContent: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  walletSub: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  walletAppliedText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "700",
  },
  paymentMethodContent: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  paymentMethodSubtext: {
    fontSize: 14,
    color: "#666",
  },
  instructionsInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    textAlignVertical: "top",
    minHeight: 80,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomContainer: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  savingsText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  placeOrderButton: {
    backgroundColor: "#E53935",
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#E53935",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  placeOrderButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  placeOrderButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  serviceabilityNote: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFF3F0",
    borderRadius: 8,
    alignItems: "center",
  },
  serviceabilityNoteText: {
    fontSize: 13,
    color: "#FF3B30",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 4,
  },
  serviceabilityLink: {
    fontSize: 14,
    color: "#48479B",
    textAlign: "center",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 40,
    minWidth: 280,
  },
  processingIcon: {
    marginBottom: 16,
  },
  processingText: {
    fontSize: 60,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#48479B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  addressName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  addAddressCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#48479B",
    borderStyle: "dashed",
  },
  addAddressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#48479B",
    marginBottom: 4,
  },
  addAddressSubtext: {
    fontSize: 14,
    color: "#666",
  },
  weekendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weekendChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  weekendChipActive: {
    backgroundColor: "#48479B",
  },
  weekendChipText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
  weekendChipTextActive: {
    color: "white",
  },
  weekendHelp: {
    marginTop: 8,
    color: "#666",
    fontSize: 12,
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
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTimeSlot: {
    borderColor: "#48479B",
    backgroundColor: "rgba(163, 211, 151, 0.27)",
  },
  timeSlotText: {
    fontSize: 14,
    color: "#48479B",
    fontWeight: "500",
  },
  selectedTimeSlotText: {
    color: "#48479B",
    fontWeight: "700",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  dateLabel: {
    fontSize: 16,
    color: "#48479B",
    fontWeight: "600",
    marginRight: 12,
  },
  dateValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginLeft: 8,
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
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  datePickerContent: {
    padding: 20,
  },
  datePickerDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  dateOptionsContainer: {
    gap: 12,
  },
  dateOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  selectedDateOption: {
    borderColor: "#48479B",
    backgroundColor: "rgba(163, 211, 151, 0.27)",
  },
  dateOptionContent: {
    flex: 1,
  },
  dateOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#48479B",
  },
  dateOptionSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#48479B",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  datePickerNote: {
    marginTop: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
  },
  datePickerNoteText: {
    fontSize: 14,
    color: "#666",
  },
  // Enhanced address styles for Zomato/Blinkit-like experience
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(163, 211, 151, 0.27)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addAddressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(163, 211, 151, 0.27)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#48479B",
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "#34C759",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },
  addressActions: {
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: {
    fontSize: 24,
    color: "#C7C7CC",
    fontWeight: "300",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#48479B",
    marginBottom: 2,
  },
  header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
  headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors.text,
    },
});
