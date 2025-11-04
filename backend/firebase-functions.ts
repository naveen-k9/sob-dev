/**
 * Firebase Cloud Functions for Notifications
 *
 * This file contains Firebase Cloud Functions that handle server-side notification triggers
 * for orders, subscriptions, payments, and other events.
 *
 * Deploy these functions to Firebase:
 * 1. Initialize Firebase Functions: firebase init functions
 * 2. Copy this code to functions/src/index.ts
 * 3. Deploy: firebase deploy --only functions
 */

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import axios from "axios";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// WhatsApp Business API Configuration
const WHATSAPP_API_URL =
  functions.config().whatsapp?.api_url || "https://graph.facebook.com/v18.0";
const WHATSAPP_PHONE_NUMBER_ID =
  functions.config().whatsapp?.phone_number_id || "";
const WHATSAPP_ACCESS_TOKEN = functions.config().whatsapp?.access_token || "";

const whatsappClient = axios.create({
  baseURL: WHATSAPP_API_URL,
  headers: {
    Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Template names (must match WhatsApp Business Manager templates)
const TEMPLATES = {
  OTP_VERIFICATION: "otp_verification",
  ORDER_CONFIRMED: "order_confirmed",
  ORDER_PREPARING: "order_preparing",
  ORDER_OUT_FOR_DELIVERY: "order_out_for_delivery",
  ORDER_DELIVERED: "order_delivered",
  ORDER_CANCELLED: "order_cancelled",
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  SUBSCRIPTION_RENEWAL: "subscription_renewal",
  SUBSCRIPTION_EXPIRING: "subscription_expiring",
  SUBSCRIPTION_EXPIRED: "subscription_expired",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILED: "payment_failed",
  DAILY_MENU_UPDATE: "daily_menu_update",
  PROMOTIONAL_OFFER: "promotional_offer",
  WALLET_CREDITED: "wallet_credited",
};

/**
 * Helper: Send WhatsApp message
 */
async function sendWhatsAppMessage(
  phoneNumber: string,
  templateName: string,
  parameters: Array<{ type: string; text?: string; image?: { link: string } }>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, "");

    const response = await whatsappClient.post(
      `/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters,
            },
          ],
        },
      }
    );

    return {
      success: true,
      messageId: response.data.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error(
      "WhatsApp message error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error?.message || "Failed to send message",
    };
  }
}

/**
 * Helper: Send push notification via FCM
 */
async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "orders",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Push notification error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cloud Function: Send WhatsApp OTP
 */
export const sendWhatsAppOTP = functions.https.onCall(async (data, context) => {
  const { phone } = data;

  if (!phone) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Phone number is required"
    );
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  try {
    // Store OTP in Firestore
    await db.collection("otps").doc(phone).set({
      otp,
      expiresAt: otpExpiry,
      createdAt: Date.now(),
    });

    // Send OTP via WhatsApp
    const result = await sendWhatsAppMessage(
      phone,
      TEMPLATES.OTP_VERIFICATION,
      [
        { type: "text", text: otp },
        { type: "text", text: "5" },
      ]
    );

    if (result.success) {
      return {
        success: true,
        messageId: result.messageId,
      };
    }

    throw new Error(result.error || "Failed to send OTP");
  } catch (error: any) {
    console.error("Send OTP error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Cloud Function: Verify WhatsApp OTP
 */
export const verifyWhatsAppOTP = functions.https.onCall(
  async (data, context) => {
    const { phone, otp } = data;

    if (!phone || !otp) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Phone and OTP are required"
      );
    }

    try {
      const otpDoc = await db.collection("otps").doc(phone).get();

      if (!otpDoc.exists) {
        throw new Error("OTP not found");
      }

      const otpData = otpDoc.data();

      if (Date.now() > otpData!.expiresAt) {
        await db.collection("otps").doc(phone).delete();
        throw new Error("OTP expired");
      }

      if (otpData!.otp !== otp) {
        throw new Error("Invalid OTP");
      }

      // Delete used OTP
      await db.collection("otps").doc(phone).delete();

      return {
        success: true,
        verified: true,
      };
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

/**
 * Cloud Function: Create custom token for Firebase Auth
 */
export const createCustomToken = functions.https.onCall(
  async (data, context) => {
    const { uid, claims } = data;

    if (!uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "UID is required"
      );
    }

    try {
      const customToken = await admin
        .auth()
        .createCustomToken(uid, claims || {});

      return {
        success: true,
        token: customToken,
      };
    } catch (error: any) {
      console.error("Create custom token error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

/**
 * Firestore Trigger: Order status change
 */
export const onOrderStatusChange = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if status changed
    if (before.status === after.status) {
      return;
    }

    const orderId = context.params.orderId;
    const userId = after.userId;
    const status = after.status;

    try {
      // Get user details
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        console.error("User not found:", userId);
        return;
      }

      const user = userDoc.data();
      const userName = user!.name || "Customer";
      const phone = user!.phone;
      const pushToken = user!.pushToken;

      // Prepare notification content based on status
      let title = "";
      let body = "";
      let templateName = "";
      let parameters: any[] = [];

      switch (status) {
        case "confirmed":
          title = "🎉 Order Confirmed!";
          body = `Your order #${orderId} has been confirmed.`;
          templateName = TEMPLATES.ORDER_CONFIRMED;
          parameters = [
            { type: "text", text: userName },
            { type: "text", text: orderId },
            { type: "text", text: after.items || "Your meal" },
            { type: "text", text: `₹${after.totalAmount || "0"}` },
            { type: "text", text: after.deliveryTime || "Soon" },
          ];
          break;
        case "preparing":
          title = "👨‍🍳 Preparing Your Order";
          body = `Your order #${orderId} is being prepared.`;
          templateName = TEMPLATES.ORDER_PREPARING;
          parameters = [
            { type: "text", text: userName },
            { type: "text", text: orderId },
          ];
          break;
        case "out_for_delivery":
          title = "🚚 On the Way!";
          body = `Your order #${orderId} is out for delivery.`;
          templateName = TEMPLATES.ORDER_OUT_FOR_DELIVERY;
          parameters = [
            { type: "text", text: userName },
            { type: "text", text: orderId },
            { type: "text", text: "30 minutes" },
          ];
          break;
        case "delivered":
          title = "✅ Order Delivered";
          body = `Your order #${orderId} has been delivered.`;
          templateName = TEMPLATES.ORDER_DELIVERED;
          parameters = [
            { type: "text", text: userName },
            { type: "text", text: orderId },
          ];
          break;
        case "cancelled":
          title = "❌ Order Cancelled";
          body = `Your order #${orderId} has been cancelled.`;
          templateName = TEMPLATES.ORDER_CANCELLED;
          parameters = [
            { type: "text", text: userName },
            { type: "text", text: orderId },
          ];
          break;
        default:
          return;
      }

      // Send push notification
      if (pushToken) {
        await sendPushNotification(pushToken, title, body, {
          type: "order_update",
          orderId,
          status,
          screen: "orders",
        });
      }

      // Send WhatsApp message
      if (phone && templateName) {
        await sendWhatsAppMessage(phone, templateName, parameters);
      }

      console.log(`Sent notifications for order ${orderId} status: ${status}`);
    } catch (error) {
      console.error("Order notification error:", error);
    }
  });

/**
 * Firestore Trigger: Subscription status change
 */
export const onSubscriptionStatusChange = functions.firestore
  .document("subscriptions/{subscriptionId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status === after.status) {
      return;
    }

    const subscriptionId = context.params.subscriptionId;
    const userId = after.userId;
    const status = after.status;
    const planName = after.planName || "Your subscription";

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) return;

      const user = userDoc.data();
      const userName = user!.name || "Customer";
      const phone = user!.phone;
      const pushToken = user!.pushToken;

      let title = "";
      let body = "";
      let templateName = "";
      let parameters: any[] = [];

      switch (status) {
        case "active":
          title = "🎊 Subscription Activated!";
          body = `Your ${planName} subscription is now active.`;
          templateName = TEMPLATES.SUBSCRIPTION_ACTIVATED;
          parameters = [
            { type: "text", text: userName },
            { type: "text", text: planName },
            { type: "text", text: after.startDate || "Today" },
            { type: "text", text: after.endDate || "N/A" },
          ];
          break;
        case "renewed":
          title = "🔄 Subscription Renewed";
          body = `Your ${planName} subscription has been renewed.`;
          templateName = TEMPLATES.SUBSCRIPTION_RENEWAL;
          parameters = [
            { type: "text", text: userName },
            { type: "text", text: planName },
            { type: "text", text: `₹${after.amount || "0"}` },
          ];
          break;
        case "expiring":
          title = "⏰ Subscription Expiring Soon";
          body = `Your ${planName} subscription will expire soon.`;
          templateName = TEMPLATES.SUBSCRIPTION_EXPIRING;
          parameters = [
            { type: "text", text: userName },
            { type: "text", text: planName },
            { type: "text", text: String(after.daysRemaining || 3) },
          ];
          break;
        case "expired":
          title = "⚠️ Subscription Expired";
          body = `Your ${planName} subscription has expired.`;
          templateName = TEMPLATES.SUBSCRIPTION_EXPIRED;
          parameters = [
            { type: "text", text: userName },
            { type: "text", text: planName },
          ];
          break;
        default:
          return;
      }

      if (pushToken) {
        await sendPushNotification(pushToken, title, body, {
          type: "subscription_update",
          subscriptionId,
          status,
          screen: "subscription",
        });
      }

      if (phone && templateName) {
        await sendWhatsAppMessage(phone, templateName, parameters);
      }

      console.log(
        `Sent notifications for subscription ${subscriptionId} status: ${status}`
      );
    } catch (error) {
      console.error("Subscription notification error:", error);
    }
  });

/**
 * Firestore Trigger: Payment status change
 */
export const onPaymentStatusChange = functions.firestore
  .document("payments/{paymentId}")
  .onCreate(async (snap, context) => {
    const payment = snap.data();
    const paymentId = context.params.paymentId;
    const userId = payment.userId;
    const status = payment.status;
    const amount = payment.amount;
    const orderId = payment.orderId;

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) return;

      const user = userDoc.data();
      const userName = user!.name || "Customer";
      const phone = user!.phone;
      const pushToken = user!.pushToken;

      const isSuccess = status === "success" || status === "completed";
      const title = isSuccess ? "✅ Payment Successful" : "❌ Payment Failed";
      const body = isSuccess
        ? `Your payment of ₹${amount} was successful.`
        : `Payment of ₹${amount} failed. Please try again.`;

      const templateName = isSuccess
        ? TEMPLATES.PAYMENT_SUCCESS
        : TEMPLATES.PAYMENT_FAILED;
      const parameters = isSuccess
        ? [
            { type: "text", text: userName },
            { type: "text", text: `₹${amount}` },
            { type: "text", text: orderId },
            { type: "text", text: payment.transactionId || "N/A" },
          ]
        : [
            { type: "text", text: userName },
            { type: "text", text: `₹${amount}` },
            { type: "text", text: orderId },
            { type: "text", text: payment.failureReason || "Unknown error" },
          ];

      if (pushToken) {
        await sendPushNotification(pushToken, title, body, {
          type: "payment_update",
          paymentId,
          status,
          screen: "wallet",
        });
      }

      if (phone) {
        await sendWhatsAppMessage(phone, templateName, parameters);
      }

      console.log(`Sent payment notification for ${paymentId}`);
    } catch (error) {
      console.error("Payment notification error:", error);
    }
  });

/**
 * Cloud Function: Send promotional notification to users
 */
export const sendPromotionalNotification = functions.https.onCall(
  async (data, context) => {
    const { userIds, title, message, offerCode, imageUrl } = data;

    if (!userIds || !Array.isArray(userIds) || !title || !message) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid parameters"
      );
    }

    try {
      const results = [];

      for (const userId of userIds) {
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) continue;

        const user = userDoc.data();
        const pushToken = user!.pushToken;
        const phone = user!.phone;
        const userName = user!.name || "Customer";

        // Send push notification
        if (pushToken) {
          await sendPushNotification(pushToken, `🎁 ${title}`, message, {
            type: "promotion",
            offerCode,
            screen: "menu",
          });
        }

        // Send WhatsApp
        if (phone) {
          await sendWhatsAppMessage(phone, TEMPLATES.PROMOTIONAL_OFFER, [
            { type: "text", text: userName },
            { type: "text", text: title },
            { type: "text", text: message },
            { type: "text", text: offerCode || "SPECIAL" },
            { type: "text", text: "7 days" },
          ]);
        }

        results.push({ userId, success: true });
      }

      return {
        success: true,
        results,
      };
    } catch (error: any) {
      console.error("Promotional notification error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

/**
 * Scheduled Function: Send daily menu updates (runs daily at 8 AM)
 */
export const sendDailyMenuUpdates = functions.pubsub
  .schedule("0 8 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    try {
      // Get today's menu
      const today = new Date().toISOString().split("T")[0];
      const menuDoc = await db.collection("menus").doc(today).get();

      if (!menuDoc.exists) {
        console.log("No menu for today");
        return;
      }

      const menu = menuDoc.data();
      const menuItems = menu!.items || "Check the app for today's menu";

      // Get all active subscribers
      const subscribersSnapshot = await db
        .collection("subscriptions")
        .where("status", "==", "active")
        .get();

      for (const subDoc of subscribersSnapshot.docs) {
        const subscription = subDoc.data();
        const userId = subscription.userId;

        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) continue;

        const user = userDoc.data();
        const pushToken = user!.pushToken;
        const phone = user!.phone;
        const userName = user!.name || "Customer";

        // Send push notification
        if (pushToken) {
          await sendPushNotification(
            pushToken,
            "🍽️ Today's Menu",
            `Check out today's delicious meals: ${menuItems}`,
            {
              type: "menu_update",
              date: today,
              screen: "menu",
            }
          );
        }

        // Send WhatsApp
        if (phone) {
          await sendWhatsAppMessage(phone, TEMPLATES.DAILY_MENU_UPDATE, [
            { type: "text", text: userName },
            { type: "text", text: today },
            { type: "text", text: menuItems },
          ]);
        }
      }

      console.log("Daily menu updates sent successfully");
    } catch (error) {
      console.error("Daily menu update error:", error);
    }
  });

/**
 * Scheduled Function: Check expiring subscriptions (runs daily)
 */
export const checkExpiringSubscriptions = functions.pubsub
  .schedule("0 9 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const subscriptionsSnapshot = await db
        .collection("subscriptions")
        .where("status", "==", "active")
        .where("endDate", "<=", threeDaysFromNow.toISOString())
        .get();

      for (const subDoc of subscriptionsSnapshot.docs) {
        const subscription = subDoc.data();
        const endDate = new Date(subscription.endDate);
        const daysRemaining = Math.ceil(
          (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining <= 3 && daysRemaining > 0) {
          const userId = subscription.userId;
          const userDoc = await db.collection("users").doc(userId).get();
          if (!userDoc.exists) continue;

          const user = userDoc.data();
          const pushToken = user!.pushToken;
          const phone = user!.phone;
          const userName = user!.name || "Customer";
          const planName = subscription.planName;

          if (pushToken) {
            await sendPushNotification(
              pushToken,
              "⏰ Subscription Expiring Soon",
              `Your ${planName} subscription will expire in ${daysRemaining} days.`,
              {
                type: "subscription_update",
                subscriptionId: subDoc.id,
                screen: "subscription",
              }
            );
          }

          if (phone) {
            await sendWhatsAppMessage(phone, TEMPLATES.SUBSCRIPTION_EXPIRING, [
              { type: "text", text: userName },
              { type: "text", text: planName },
              { type: "text", text: String(daysRemaining) },
            ]);
          }

          // Update subscription status
          await subDoc.ref.update({ status: "expiring", daysRemaining });
        }
      }

      console.log("Expiring subscriptions check completed");
    } catch (error) {
      console.error("Expiring subscriptions check error:", error);
    }
  });
