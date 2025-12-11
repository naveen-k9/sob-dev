/**
 * Firebase Cloud Functions for Notifications (V2 API)
 *
 * This file contains Firebase Cloud Functions that handle server-side notification triggers
 * for orders, subscriptions, payments, and other events.
 *
 * DEPLOYMENT:
 * 1. Initialize Firebase Functions: firebase init functions
 * 2. Copy this code to functions/src/index.ts
 * 3. Update functions/package.json with dependencies
 * 4. Set environment: firebase functions:config:set whatsapp.api_url="..." whatsapp.phone_number_id="..." whatsapp.access_token="..."
 * 5. Deploy: firebase deploy --only functions
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  onDocumentUpdated,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";
import axios from "axios";

// Service Account Key embedded directly
const serviceAccount = {
  type: "service_account",
  project_id: "sameoldbox-21666",
  private_key_id: "350fda6e375093f3629aaa6a5e0fa5f39fcddac3",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDbm0EwgaIqnEUN\nrWEYXr9Tl4bJIQht6VloESDEhZ2WuXJstlB5Vl2i/oKUuYAgQaQ0LmJVytgThzjN\nXymOUFVE/a/Q4Bypam+4CAMsAvVZCV3daouOnod6hYSaSJ19JAJ4gTQFePZc+EMs\nFRQXYYbXqSpbvlzbTBffu4f4e2YrxO5hZtzKnnu07DmeGglafY20JvT05H+dUven\ndBTKPoCo9k9TyOVJX9z09ekl0pO7DJKWW7hpuaQDaJylyqGUJWRFk0ZGAPp4L9kP\nyO+z/NxPCXl8HQ95LTpYLKS5Mir9Y7dS1EX40SOICGj92TNDjTBVg8r3J1uVZinK\niUyoZCBrAgMBAAECggEADLkpBLtt/tQA+DLkXjoXEavExmBgkaWkZXAgmuI26CWk\naIIDlZQYZroiLKW2s6e58MADOH9BF5iNBPEPgkxLNG0SQ6LIZlRhVqM4M9OUDW2K\nf6qNnVy38rRLo3izjy2H6x1pOyvv8iD8G1C5UkV3P4Vwi9IypQ36kB7YWOAlYkGy\nJ7dzhz615gk2aCNZVMCXrMYAr1Fc0TYIVOPDwmUlBOejOJL10eC50E1HH+Al1mja\nszhTeyR6aKE0dPNr9jhDEAfbiKjOcxW1eotQ5Oq8j2AGL/SweLeu9A8QpK4LuCPp\nsbdXVZMKGlfpJ6F1SiExo2xJtb7fa8OkDFfZHVif6QKBgQDwiiS/5VBuT+mppCBx\nBT77dKCWGhKubvl8TDpoZOYzikN++zDYihbeIC3NqULmQpY9zxCEQ9EbQnL9nweW\n1/cwBFmBKWiTNkEIe3yTsLzsaLBtFbFzrP0zg7qxq6F0qC0nGd7Mc4NQDBi/peY8\nBR5chprn5LpoRA+9gly/RMks9wKBgQDpuKzkarda8lF7ufDds/ocCIfSqd5H8Hdy\nqgjiQUfjzdDO2TjkK5hN2PSk8u9vijcDzNIRMSumJG60Y3mO59rI1RYzYPAcj8tQ\nH712oOgN9lrUtg26lPV1nvp/k7Aak4kZP5BWvKHJrqLm7jDL/KoKCoPypOS/XDA1\nIdFvTlFPLQKBgQCFixymEUkbRXCjx0RfmxsBfhmd3DHc+C247ZVL2iDYIn4gpJLU\n1a2metUTJlLHBdblz+0KkaApczXmSwFqpNJOrUuH4xZ1DJ0EeZKLaIcq9WBl37Ja\nV4Nns03WUEReQPR4jetdNRCFQ4IF/LQbRHg7xFuCPUGkm4zlmNenNSg/twKBgDa8\nHSFRLKeL4DFNlm8VWxl9lfFr/rZyRkcAMxxplWBwLtqCXKRy4TQ5/vEyQ4inocKu\nEPQdw88g8Rwlv64L9lzaKlzV8uV9d2vIQyKpBC9g5lyyVfzALcvh82A1QiS3MIBN\nNoxZmLoWv+e9GIhtH5VCaSxGGZwHBvMqfFXIzZnxAoGAI84TtBv73XS8iGEP/AC2\nM6w9BSskt1GJu1/zbc5z03ETOIHndtGBjWHibL6nv2I7lQN0w9p/w5c6jwz+6Jj9\nDZY0s1aNZ/MinG4A8l2sprLu9sVf7phv9v9yyY1OLzwFPBzLj43ubs46mP3Jyvtz\nDMlMGrdttExIGGK588HrMrA=\n-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-fbsvc@sameoldbox-21666.iam.gserviceaccount.com",
  client_id: "101381989101719936752",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40sameoldbox-21666.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

// Define configuration parameters
const WHATSAPP_API_URL = defineString("WHATSAPP_API_URL", {
  default: "https://graph.facebook.com/v22.0",
});
const WHATSAPP_PHONE_NUMBER_ID = defineString("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_ACCESS_TOKEN =
  "EAAVLZCZBw38D8BP6cVYgnxZCqbZCXZB2gn1x8llkZAm0TXM4g8aYarPMPZAIw3OQ3QReZA8fYAJR9WBrayVzOkK2OkDZAhudZAInaq4EvtVnpAHnZBwyyDF3tttJ9MhNtmsfE1ZAwkTP4NJhHMzTDDu0rs8PhSkNJwAQzDSOc5ZCA93VvdcAUHWozHTteZCx4kQ4tGpsj3jKO573J6XFYZAZCouR4l6BcRZA2OGVYvqgp8GZBX5niVNl8ZD";

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
 * Helper: Get WhatsApp client
 */
function getWhatsAppClient() {
  return axios.create({
    baseURL: WHATSAPP_API_URL.value(),
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Helper: Send WhatsApp message
 */
async function sendWhatsAppMessage(
  phoneNumber: string,
  templateName: string,
  parameters: Array<{ type: string; text?: string; image?: { link: string } }>,
  includeButton?: boolean
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const whatsappClient = getWhatsAppClient();
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, "");

    const components: any[] = [
      {
        type: "body",
        parameters,
      },
    ];

    // Add button component if needed (e.g., for OTP templates)
    if (includeButton && parameters.length > 0) {
      components.push({
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [
          {
            type: "text",
            text: parameters[0].text, // Use first parameter (OTP) for button
          },
        ],
      });
    }

    const response = await whatsappClient.post(
      `/${WHATSAPP_PHONE_NUMBER_ID.value()}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en_US" },
          components,
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
export const sendWhatsAppOTP = onCall(async (request) => {
  const { phone } = request.data;

  console.log("sendWhatsAppOTP called with phone:", phone);

  if (!phone) {
    throw new HttpsError("invalid-argument", "Phone number is required");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  console.log("Generated OTP:", otp, "Expiry:", otpExpiry);

  try {
    // Store OTP in Firestore
    console.log("Attempting to store OTP in Firestore...");
    const otpRef = db.collection("otps").doc(phone);
    await otpRef.set({
      otp,
      expiresAt: otpExpiry,
      createdAt: Date.now(),
      phone: phone, // Add phone for debugging
    });
    console.log("OTP stored successfully in Firestore");

    // Verify it was written
    const verifyDoc = await otpRef.get();
    console.log(
      "Verification - Document exists:",
      verifyDoc.exists,
      "Data:",
      verifyDoc.data()
    );

    // Send OTP via WhatsApp
    console.log("Sending OTP via WhatsApp...");
    const result = await sendWhatsAppMessage(
      phone,
      TEMPLATES.OTP_VERIFICATION,
      [{ type: "text", text: otp }],
      true // Include button component for OTP
    );

    console.log("WhatsApp send result:", result);

    if (result.success) {
      console.log(
        "Returning success response with messageId:",
        result.messageId
      );
      return {
        success: true,
        messageId: result.messageId,
        otpStored: true, // Confirm OTP was stored
        debug: {
          phone,
          otpLength: otp.length,
          expiresAt: otpExpiry,
        },
      };
    }

    throw new Error(result.error || "Failed to send OTP");
  } catch (error: any) {
    console.error("Send OTP error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Cloud Function: Verify WhatsApp OTP (Optimized)
 */
export const verifyWhatsAppOTP = onCall(async (request) => {
  const { phone, otp } = request.data;

  if (!phone || !otp) {
    throw new HttpsError("invalid-argument", "Phone and OTP are required");
  }

  try {
    // Verify OTP from Firestore
    const otpDoc = await db.collection("otps").doc(phone).get();

    if (!otpDoc.exists) {
      throw new Error("OTP not found or already used");
    }

    const otpData = otpDoc.data();

    // Check expiry
    if (Date.now() > otpData!.expiresAt) {
      await db.collection("otps").doc(phone).delete();
      throw new Error("OTP expired");
    }

    // Verify OTP
    if (otpData!.otp !== otp) {
      throw new Error("Invalid OTP");
    }

    // OTP is valid - delete it and check for existing user
    const uid = phone.replace(/[^0-9]/g, "");

    // Get existing user or prepare new user data
    const userRef = db.collection("users").doc(uid);
    const [userDoc] = await Promise.all([
      userRef.get(),
      db.collection("otps").doc(phone).delete(), // Delete OTP in parallel
    ]);

    let userData: any;
    let isNewUser = false;
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    if (userDoc.exists) {
      // Existing user - get role from database
      userData = userDoc.data();
      userRef.update({ lastLogin: timestamp }); // Don't await
    } else {
      // New user - create with default 'customer' role
      isNewUser = true;
      userData = {
        uid,
        phone,
        role: "customer", // Always default to customer for new users
        name: "",
        email: "",
        addresses: [],
        createdAt: timestamp,
        lastLogin: timestamp,
      };
      userRef.set(userData); // Don't await
    }

    // Create Firebase Auth user and custom token in parallel
    const authPromises = [];

    // Try to create auth user (will fail silently if exists)
    authPromises.push(
      admin
        .auth()
        .createUser({ uid, phoneNumber: phone })
        .catch((err) => {
          // Ignore if user already exists
          if (err.code !== "auth/uid-already-exists") {
            console.error("Auth user creation error:", err);
          }
        })
    );

    // Generate custom token with user's role from database
    authPromises.push(
      admin
        .auth()
        .createCustomToken(uid, { role: userData.role || "customer", phone })
    );

    const [, customToken] = await Promise.all(authPromises);

    return {
      success: true,
      verified: true,
      token: customToken,
      uid,
      isNewUser, // Flag to determine if basic-info screen should be shown
      user: {
        uid,
        phone: userData.phone || phone,
        name: userData.name || "",
        email: userData.email || "",
        role: userData.role || "customer",
        addresses: userData.addresses || [],
      },
    };
  } catch (error: any) {
    console.error("Verify OTP error:", error.message);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Scheduled Function: Cleanup expired OTPs
 * Runs every hour to remove expired OTP documents
 */
export const cleanupExpiredOTPs = onSchedule(
  {
    schedule: "every 1 hours",
    timeZone: "Asia/Kolkata",
  },
  async () => {
    try {
      const now = Date.now();
      const expiredOTPs = await db
        .collection("otps")
        .where("expiresAt", "<", now)
        .get();

      if (expiredOTPs.empty) {
        console.log("No expired OTPs to clean up");
        return;
      }

      const batch = db.batch();
      expiredOTPs.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${expiredOTPs.size} expired OTPs`);
    } catch (error) {
      console.error("Error cleaning up expired OTPs:", error);
    }
  }
);
/**
 * Firestore Trigger: Order status change
 */
export const onOrderStatusChange = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    // Check if status changed
    if (before.status === after.status) {
      return;
    }

    const orderId = event.params.orderId;
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
  }
);

/**
 * Firestore Trigger: Subscription status change
 */
export const onSubscriptionStatusChange = onDocumentUpdated(
  "subscriptions/{subscriptionId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    if (before.status === after.status) {
      return;
    }

    const subscriptionId = event.params.subscriptionId;
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
  }
);

/**
 * Firestore Trigger: Payment status change
 */
export const onPaymentStatusChange = onDocumentCreated(
  "payments/{paymentId}",
  async (event) => {
    const payment = event.data?.data();

    if (!payment) return;

    const paymentId = event.params.paymentId;
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
  }
);

/**
 * Cloud Function: Send promotional notification to users
 */
export const sendPromotionalNotification = onCall(async (request) => {
  const { userIds, title, message, offerCode } = request.data;

  if (!userIds || !Array.isArray(userIds) || !title || !message) {
    throw new HttpsError("invalid-argument", "Invalid parameters");
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
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Scheduled Function: Send daily menu updates (runs daily at 8 AM IST)
 */
export const sendDailyMenuUpdates = onSchedule("0 8 * * *", async () => {
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
 * Scheduled Function: Check expiring subscriptions (runs daily at 9 AM IST)
 * This function checks for:
 * 1. Subscriptions expiring in 3 days (send warning)
 * 2. Subscriptions that have expired (mark as expired and send notification)
 */
export const checkExpiringSubscriptions = onSchedule("0 9 * * *", async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Check for expiring subscriptions
    const expiringSnapshot = await db
      .collection("subscriptions")
      .where("status", "==", "active")
      .where("endDate", "<=", threeDaysFromNow.toISOString())
      .where("endDate", ">", now.toISOString())
      .get();

    for (const subDoc of expiringSnapshot.docs) {
      const subscription = subDoc.data();
      const endDate = new Date(subscription.endDate);
      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
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

        // Update subscription status to expiring
        await subDoc.ref.update({ status: "expiring", daysRemaining });
      }
    }

    // AUTO-TRIGGER: Check for expired subscriptions and mark them as expired
    const expiredSnapshot = await db
      .collection("subscriptions")
      .where("status", "in", ["active", "expiring"])
      .where("endDate", "<=", now.toISOString())
      .get();

    for (const subDoc of expiredSnapshot.docs) {
      const subscription = subDoc.data();
      const userId = subscription.userId;

      // Update status to expired - THIS IS THE AUTO-TRIGGER
      await subDoc.ref.update({
        status: "expired",
        expiredAt: now.toISOString(),
      });

      console.log(`Auto-expired subscription ${subDoc.id} for user ${userId}`);

      // Send expiration notification
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
          "⚠️ Subscription Expired",
          `Your ${planName} subscription has expired.`,
          {
            type: "subscription_update",
            subscriptionId: subDoc.id,
            screen: "subscription",
          }
        );
      }

      if (phone) {
        await sendWhatsAppMessage(phone, TEMPLATES.SUBSCRIPTION_EXPIRED, [
          { type: "text", text: userName },
          { type: "text", text: planName },
        ]);
      }
    }

    console.log("Subscription expiry check completed");
  } catch (error) {
    console.error("Subscription expiry check error:", error);
  }
});

/**
 * Cloud Function: List all OTPs (for debugging)
 */
export const listAllOTPs = onCall(async (request) => {
  try {
    const otpsSnapshot = await db.collection("otps").get();

    if (otpsSnapshot.empty) {
      return {
        success: true,
        count: 0,
        message: "No OTPs found in database",
        otps: [],
      };
    }

    const otps = otpsSnapshot.docs.map((doc) => ({
      phone: doc.id,
      data: doc.data(),
      expired: Date.now() > doc.data().expiresAt,
    }));

    return {
      success: true,
      count: otps.length,
      otps,
    };
  } catch (error: any) {
    console.error("List OTPs error:", error);
    throw new HttpsError("internal", error.message);
  }
});
