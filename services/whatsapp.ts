/**
 * WhatsApp template names and types (reference only).
 * All WhatsApp sending is done via Firebase Functions; no API or tokens in the app.
 */

// Template names (must match WhatsApp Business Manager and functions/src/index.ts TEMPLATES)
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
  ADDON_PURCHASED: "addon_purchased",
};

export interface WhatsAppMessage {
  to: string;
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

export default {
  WHATSAPP_TEMPLATES,
};
