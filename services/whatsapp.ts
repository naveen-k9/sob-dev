import axios from "axios";
import Constants from "expo-constants";

// WhatsApp Business API Configuration
const WHATSAPP_API_URL =
  process.env.EXPO_PUBLIC_WHATSAPP_API_URL ||
  "https://graph.facebook.com/v18.0";
const WHATSAPP_PHONE_NUMBER_ID =
  process.env.EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN || "";
const WHATSAPP_BUSINESS_ACCOUNT_ID =
  process.env.EXPO_PUBLIC_WHATSAPP_BUSINESS_ACCOUNT_ID || "";

// WhatsApp API Client
const whatsappClient = axios.create({
  baseURL: WHATSAPP_API_URL,
  headers: {
    Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Template Names - Create these in WhatsApp Business Manager
export const WHATSAPP_TEMPLATES = {
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
  REFERRAL_REWARD: "referral_reward",
};

export interface WhatsAppMessage {
  to: string; // Phone number in international format (e.g., 919876543210)
  templateName: string;
  language?: string;
  components?: {
    type: string;
    parameters: Array<{
      type: string;
      text?: string;
      image?: { link: string };
    }>;
  }[];
}

/**
 * Send OTP via WhatsApp
 */
export async function sendWhatsAppOTP(
  phoneNumber: string,
  otp: string
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
          name: WHATSAPP_TEMPLATES.OTP_VERIFICATION,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: otp },
                { type: "text", text: "5" }, // OTP validity in minutes
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: 0,
              parameters: [{ type: "text", text: otp }],
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
    console.error("WhatsApp OTP Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || "Failed to send OTP",
    };
  }
}

/**
 * Send Order Notification
 */
export async function sendOrderNotification(
  phoneNumber: string,
  orderDetails: {
    orderId: string;
    status:
      | "confirmed"
      | "preparing"
      | "out_for_delivery"
      | "delivered"
      | "cancelled";
    customerName: string;
    items?: string;
    totalAmount?: string;
    deliveryTime?: string;
    trackingUrl?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, "");

    let templateName: string;
    let parameters: any[] = [];

    switch (orderDetails.status) {
      case "confirmed":
        templateName = WHATSAPP_TEMPLATES.ORDER_CONFIRMED;
        parameters = [
          { type: "text", text: orderDetails.customerName },
          { type: "text", text: orderDetails.orderId },
          {
            type: "text",
            text: orderDetails.items || "Your meal subscription",
          },
          { type: "text", text: orderDetails.totalAmount || "N/A" },
          { type: "text", text: orderDetails.deliveryTime || "Soon" },
        ];
        break;
      case "preparing":
        templateName = WHATSAPP_TEMPLATES.ORDER_PREPARING;
        parameters = [
          { type: "text", text: orderDetails.customerName },
          { type: "text", text: orderDetails.orderId },
        ];
        break;
      case "out_for_delivery":
        templateName = WHATSAPP_TEMPLATES.ORDER_OUT_FOR_DELIVERY;
        parameters = [
          { type: "text", text: orderDetails.customerName },
          { type: "text", text: orderDetails.orderId },
          { type: "text", text: orderDetails.deliveryTime || "30 minutes" },
        ];
        break;
      case "delivered":
        templateName = WHATSAPP_TEMPLATES.ORDER_DELIVERED;
        parameters = [
          { type: "text", text: orderDetails.customerName },
          { type: "text", text: orderDetails.orderId },
        ];
        break;
      case "cancelled":
        templateName = WHATSAPP_TEMPLATES.ORDER_CANCELLED;
        parameters = [
          { type: "text", text: orderDetails.customerName },
          { type: "text", text: orderDetails.orderId },
        ];
        break;
      default:
        throw new Error("Invalid order status");
    }

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
      "WhatsApp Order Notification Error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error?.message || "Failed to send notification",
    };
  }
}

/**
 * Send Subscription Notification
 */
export async function sendSubscriptionNotification(
  phoneNumber: string,
  subscriptionDetails: {
    customerName: string;
    planName: string;
    status: "activated" | "renewal" | "expiring" | "expired";
    startDate?: string;
    endDate?: string;
    daysRemaining?: number;
    renewalAmount?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, "");

    let templateName: string;
    let parameters: any[] = [];

    switch (subscriptionDetails.status) {
      case "activated":
        templateName = WHATSAPP_TEMPLATES.SUBSCRIPTION_ACTIVATED;
        parameters = [
          { type: "text", text: subscriptionDetails.customerName },
          { type: "text", text: subscriptionDetails.planName },
          { type: "text", text: subscriptionDetails.startDate || "Today" },
          { type: "text", text: subscriptionDetails.endDate || "N/A" },
        ];
        break;
      case "renewal":
        templateName = WHATSAPP_TEMPLATES.SUBSCRIPTION_RENEWAL;
        parameters = [
          { type: "text", text: subscriptionDetails.customerName },
          { type: "text", text: subscriptionDetails.planName },
          { type: "text", text: subscriptionDetails.renewalAmount || "N/A" },
        ];
        break;
      case "expiring":
        templateName = WHATSAPP_TEMPLATES.SUBSCRIPTION_EXPIRING;
        parameters = [
          { type: "text", text: subscriptionDetails.customerName },
          { type: "text", text: subscriptionDetails.planName },
          {
            type: "text",
            text: String(subscriptionDetails.daysRemaining || 3),
          },
        ];
        break;
      case "expired":
        templateName = WHATSAPP_TEMPLATES.SUBSCRIPTION_EXPIRED;
        parameters = [
          { type: "text", text: subscriptionDetails.customerName },
          { type: "text", text: subscriptionDetails.planName },
        ];
        break;
      default:
        throw new Error("Invalid subscription status");
    }

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
      "WhatsApp Subscription Notification Error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error?.message || "Failed to send notification",
    };
  }
}

/**
 * Send Payment Notification
 */
export async function sendPaymentNotification(
  phoneNumber: string,
  paymentDetails: {
    customerName: string;
    status: "success" | "failed";
    amount: string;
    orderId: string;
    transactionId?: string;
    failureReason?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, "");

    const templateName =
      paymentDetails.status === "success"
        ? WHATSAPP_TEMPLATES.PAYMENT_SUCCESS
        : WHATSAPP_TEMPLATES.PAYMENT_FAILED;

    const parameters =
      paymentDetails.status === "success"
        ? [
            { type: "text", text: paymentDetails.customerName },
            { type: "text", text: paymentDetails.amount },
            { type: "text", text: paymentDetails.orderId },
            { type: "text", text: paymentDetails.transactionId || "N/A" },
          ]
        : [
            { type: "text", text: paymentDetails.customerName },
            { type: "text", text: paymentDetails.amount },
            { type: "text", text: paymentDetails.orderId },
            {
              type: "text",
              text: paymentDetails.failureReason || "Unknown error",
            },
          ];

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
      "WhatsApp Payment Notification Error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error?.message || "Failed to send notification",
    };
  }
}

/**
 * Send Promotional Message
 */
export async function sendPromotionalMessage(
  phoneNumber: string,
  details: {
    customerName: string;
    offerTitle: string;
    offerDescription: string;
    discountCode?: string;
    validUntil?: string;
    imageUrl?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, "");

    const components: any[] = [
      {
        type: "body",
        parameters: [
          { type: "text", text: details.customerName },
          { type: "text", text: details.offerTitle },
          { type: "text", text: details.offerDescription },
          { type: "text", text: details.discountCode || "SPECIAL" },
          { type: "text", text: details.validUntil || "7 days" },
        ],
      },
    ];

    if (details.imageUrl) {
      components.unshift({
        type: "header",
        parameters: [{ type: "image", image: { link: details.imageUrl } }],
      });
    }

    const response = await whatsappClient.post(
      `/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: WHATSAPP_TEMPLATES.PROMOTIONAL_OFFER,
          language: { code: "en" },
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
      "WhatsApp Promotional Message Error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error?.message || "Failed to send message",
    };
  }
}

/**
 * Send Daily Menu Update
 */
export async function sendDailyMenuUpdate(
  phoneNumber: string,
  details: {
    customerName: string;
    menuItems: string;
    date: string;
  }
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
          name: WHATSAPP_TEMPLATES.DAILY_MENU_UPDATE,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: details.customerName },
                { type: "text", text: details.date },
                { type: "text", text: details.menuItems },
              ],
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
      "WhatsApp Menu Update Error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error?.message || "Failed to send notification",
    };
  }
}

/**
 * Send Wallet Credit Notification
 */
export async function sendWalletCreditNotification(
  phoneNumber: string,
  details: {
    customerName: string;
    amount: string;
    reason: string;
    newBalance: string;
  }
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
          name: WHATSAPP_TEMPLATES.WALLET_CREDITED,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: details.customerName },
                { type: "text", text: details.amount },
                { type: "text", text: details.reason },
                { type: "text", text: details.newBalance },
              ],
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
      "WhatsApp Wallet Credit Error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error?.message || "Failed to send notification",
    };
  }
}

/**
 * Verify WhatsApp Business Account Configuration
 */
export async function verifyWhatsAppConfiguration(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return {
        success: false,
        error:
          "WhatsApp configuration missing. Please set EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN and EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID",
      };
    }

    const response = await whatsappClient.get(`/${WHATSAPP_PHONE_NUMBER_ID}`);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error(
      "WhatsApp Verification Error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error?.message ||
        "Failed to verify WhatsApp configuration",
    };
  }
}

export default {
  sendWhatsAppOTP,
  sendOrderNotification,
  sendSubscriptionNotification,
  sendPaymentNotification,
  sendPromotionalMessage,
  sendDailyMenuUpdate,
  sendWalletCreditNotification,
  verifyWhatsAppConfiguration,
};
