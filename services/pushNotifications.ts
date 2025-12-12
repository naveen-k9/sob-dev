import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  categoryIdentifier?: string;
}

/**
 * Register for push notifications and get token
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    // Order notifications channel
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Order Updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4CAF50",
      sound: "default",
      description: "Notifications for order status updates",
    });

    // Subscription notifications channel
    await Notifications.setNotificationChannelAsync("subscriptions", {
      name: "Subscription Updates",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: "#2196F3",
      sound: "default",
      description: "Notifications for subscription updates",
    });

    // Promotional notifications channel
    await Notifications.setNotificationChannelAsync("promotions", {
      name: "Offers & Promotions",
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 250],
      lightColor: "#FF9800",
      description: "Promotional offers and deals",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    try {
      // Get the Expo push token
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        "e5fe3050-5e31-440e-a49f-ea6d40d26eba";
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token:", token);
    } catch (error) {
      console.error("Error getting push token:", error);
    }

    // For iOS, also get the device push token (APNs)
    if (Platform.OS === "ios") {
      try {
        const deviceToken = (await Notifications.getDevicePushTokenAsync())
          .data;
        console.log("APNs Device Token:", deviceToken);
      } catch (error) {
        console.error("Error getting APNs token:", error);
      }
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

/**
 * Send a local notification
 */
export async function sendLocalNotification(
  notification: PushNotificationData
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: notification.sound || "default",
      badge: notification.badge,
      categoryIdentifier: notification.categoryIdentifier,
    },
    trigger: null, // Send immediately
  });

  return notificationId;
}

/**
 * Schedule a notification for later
 */
export async function scheduleNotification(
  notification: PushNotificationData,
  trigger: Notifications.NotificationTriggerInput
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: notification.sound || "default",
      badge: notification.badge,
    },
    trigger,
  });

  return notificationId;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Order status notification
 */
export async function sendOrderNotification(orderDetails: {
  orderId: string;
  status:
    | "confirmed"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  customerName: string;
}): Promise<string> {
  let title = "";
  let body = "";
  let categoryIdentifier = "ORDER_UPDATE";

  switch (orderDetails.status) {
    case "confirmed":
      title = "🎉 Order Confirmed!";
      body = `Hi ${orderDetails.customerName}! Your order #${orderDetails.orderId} has been confirmed.`;
      break;
    case "preparing":
      title = "👨‍🍳 Preparing Your Order";
      body = `Your order #${orderDetails.orderId} is being prepared with love!`;
      break;
    case "out_for_delivery":
      title = "🚚 On the Way!";
      body = `Your order #${orderDetails.orderId} is out for delivery. It will arrive soon!`;
      break;
    case "delivered":
      title = "✅ Order Delivered";
      body = `Your order #${orderDetails.orderId} has been delivered. Enjoy your meal!`;
      break;
    case "cancelled":
      title = "❌ Order Cancelled";
      body = `Your order #${orderDetails.orderId} has been cancelled.`;
      break;
  }

  return await sendLocalNotification({
    title,
    body,
    data: {
      type: "order_update",
      orderId: orderDetails.orderId,
      status: orderDetails.status,
      screen: "orders",
    },
    categoryIdentifier,
  });
}

/**
 * Subscription notification
 */
export async function sendSubscriptionNotification(subscriptionDetails: {
  planName: string;
  status: "activated" | "renewal" | "expiring" | "expired";
  daysRemaining?: number;
}): Promise<string> {
  let title = "";
  let body = "";

  switch (subscriptionDetails.status) {
    case "activated":
      title = "🎊 Subscription Activated!";
      body = `Your ${subscriptionDetails.planName} subscription is now active. Enjoy your meals!`;
      break;
    case "renewal":
      title = "🔄 Subscription Renewed";
      body = `Your ${subscriptionDetails.planName} subscription has been renewed successfully.`;
      break;
    case "expiring":
      title = "⏰ Subscription Expiring Soon";
      body = `Your ${subscriptionDetails.planName} subscription will expire in ${subscriptionDetails.daysRemaining} days.`;
      break;
    case "expired":
      title = "⚠️ Subscription Expired";
      body = `Your ${subscriptionDetails.planName} subscription has expired. Renew now to continue enjoying meals.`;
      break;
  }

  return await sendLocalNotification({
    title,
    body,
    data: {
      type: "subscription_update",
      planName: subscriptionDetails.planName,
      status: subscriptionDetails.status,
      screen: "subscription",
    },
    categoryIdentifier: "SUBSCRIPTION_UPDATE",
  });
}

/**
 * Payment notification
 */
export async function sendPaymentNotification(paymentDetails: {
  status: "success" | "failed";
  amount: string;
  orderId: string;
}): Promise<string> {
  const title =
    paymentDetails.status === "success"
      ? "✅ Payment Successful"
      : "❌ Payment Failed";

  const body =
    paymentDetails.status === "success"
      ? `Your payment of ₹${paymentDetails.amount} for order #${paymentDetails.orderId} was successful.`
      : `Payment of ₹${paymentDetails.amount} for order #${paymentDetails.orderId} failed. Please try again.`;

  return await sendLocalNotification({
    title,
    body,
    data: {
      type: "payment_update",
      status: paymentDetails.status,
      orderId: paymentDetails.orderId,
      amount: paymentDetails.amount,
      screen: "wallet",
    },
    categoryIdentifier: "PAYMENT_UPDATE",
  });
}

/**
 * Promotional notification
 */
export async function sendPromotionalNotification(details: {
  title: string;
  message: string;
  offerCode?: string;
  imageUrl?: string;
}): Promise<string> {
  return await sendLocalNotification({
    title: `🎁 ${details.title}`,
    body: details.message,
    data: {
      type: "promotion",
      offerCode: details.offerCode,
      imageUrl: details.imageUrl,
      screen: "menu",
    },
    categoryIdentifier: "PROMOTION",
  });
}

/**
 * Daily menu update notification
 */
export async function sendMenuUpdateNotification(details: {
  date: string;
  menuItems: string;
}): Promise<string> {
  return await sendLocalNotification({
    title: "🍽️ Today's Menu",
    body: `Check out today's delicious meals: ${details.menuItems}`,
    data: {
      type: "menu_update",
      date: details.date,
      screen: "menu",
    },
    categoryIdentifier: "MENU_UPDATE",
  });
}

/**
 * Wallet credit notification
 */
export async function sendWalletCreditNotification(details: {
  amount: string;
  reason: string;
  newBalance: string;
}): Promise<string> {
  return await sendLocalNotification({
    title: "💰 Wallet Credited",
    body: `₹${details.amount} added to your wallet. ${details.reason}. New balance: ₹${details.newBalance}`,
    data: {
      type: "wallet_credit",
      amount: details.amount,
      reason: details.reason,
      screen: "wallet",
    },
    categoryIdentifier: "WALLET_UPDATE",
  });
}

/**
 * Referral reward notification
 */
export async function sendReferralRewardNotification(details: {
  amount: string;
  referredUserName: string;
}): Promise<string> {
  return await sendLocalNotification({
    title: "🎉 Referral Reward!",
    body: `You earned ₹${details.amount} for referring ${details.referredUserName}!`,
    data: {
      type: "referral_reward",
      amount: details.amount,
      screen: "refer",
    },
    categoryIdentifier: "REFERRAL_REWARD",
  });
}

/**
 * Set up notification categories with actions
 */
export async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS === "ios") {
    await Notifications.setNotificationCategoryAsync("ORDER_UPDATE", [
      {
        identifier: "VIEW_ORDER",
        buttonTitle: "View Order",
        options: { opensAppToForeground: true },
      },
      {
        identifier: "TRACK_ORDER",
        buttonTitle: "Track",
        options: { opensAppToForeground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync("SUBSCRIPTION_UPDATE", [
      {
        identifier: "VIEW_SUBSCRIPTION",
        buttonTitle: "View Details",
        options: { opensAppToForeground: true },
      },
      {
        identifier: "RENEW_SUBSCRIPTION",
        buttonTitle: "Renew Now",
        options: { opensAppToForeground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync("PROMOTION", [
      {
        identifier: "VIEW_OFFER",
        buttonTitle: "View Offer",
        options: { opensAppToForeground: true },
      },
    ]);
  }
}

/**
 * Handle notification response (when user taps on notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Handle notification received (when app is in foreground)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

export default {
  registerForPushNotificationsAsync,
  sendLocalNotification,
  scheduleNotification,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  getBadgeCount,
  setBadgeCount,
  clearBadge,
  sendOrderNotification,
  sendSubscriptionNotification,
  sendPaymentNotification,
  sendPromotionalNotification,
  sendMenuUpdateNotification,
  sendWalletCreditNotification,
  sendReferralRewardNotification,
  setupNotificationCategories,
  addNotificationResponseListener,
  addNotificationReceivedListener,
};
