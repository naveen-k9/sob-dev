import {
  sendOrderNotification as sendPushOrderNotification,
  sendSubscriptionNotification as sendPushSubscriptionNotification,
  sendPaymentNotification as sendPushPaymentNotification,
  sendPromotionalNotification as sendPushPromotionalNotification,
  sendMenuUpdateNotification as sendPushMenuUpdateNotification,
  sendWalletCreditNotification as sendPushWalletCreditNotification,
  sendReferralRewardNotification as sendPushReferralRewardNotification,
} from "@/services/pushNotifications";

/**
 * Unified notification handler: push from app; WhatsApp is sent by Firebase triggers/callables only.
 */

export interface NotificationRecipient {
  userId: string;
  name: string;
  phone: string;
  pushToken?: string;
}

/**
 * Send order update notifications via both channels
 */
export async function notifyOrderUpdate(
  recipient: NotificationRecipient,
  orderDetails: {
    orderId: string;
    status:
      | "confirmed"
      | "preparing"
      | "out_for_delivery"
      | "delivered"
      | "cancelled";
    items?: string;
    totalAmount?: string;
    deliveryTime?: string;
    trackingUrl?: string;
  }
) {
  const results = {
    push: { success: false, error: undefined as string | undefined },
    whatsapp: { success: false, error: undefined as string | undefined },
  };

  // Send push notification (WhatsApp is sent by Firestore trigger on order status change)
  try {
    if (recipient.pushToken) {
      await sendPushOrderNotification({
        orderId: orderDetails.orderId,
        status: orderDetails.status,
        customerName: recipient.name,
      });
      results.push.success = true;
    }
  } catch (error: any) {
    console.error("Push notification error:", error);
    results.push.error = error.message;
  }

  return results;
}

/**
 * Send subscription update notifications
 */
export async function notifySubscriptionUpdate(
  recipient: NotificationRecipient,
  subscriptionDetails: {
    planName: string;
    status: "activated" | "renewal" | "expiring" | "expired";
    startDate?: string;
    endDate?: string;
    daysRemaining?: number;
    renewalAmount?: string;
  }
) {
  const results = {
    push: { success: false, error: undefined as string | undefined },
    whatsapp: { success: false, error: undefined as string | undefined },
  };

  // Send push notification (WhatsApp is sent by Firestore trigger on subscription status change)
  try {
    if (recipient.pushToken) {
      await sendPushSubscriptionNotification({
        planName: subscriptionDetails.planName,
        status: subscriptionDetails.status,
        daysRemaining: subscriptionDetails.daysRemaining,
      });
      results.push.success = true;
    }
  } catch (error: any) {
    console.error("Push notification error:", error);
    results.push.error = error.message;
  }

  return results;
}

/**
 * Send payment notifications
 */
export async function notifyPaymentStatus(
  recipient: NotificationRecipient,
  paymentDetails: {
    status: "success" | "failed";
    amount: string;
    orderId: string;
    transactionId?: string;
    failureReason?: string;
  }
) {
  const results = {
    push: { success: false, error: undefined as string | undefined },
    whatsapp: { success: false, error: undefined as string | undefined },
  };

  // Send push notification (WhatsApp is sent by Firestore trigger on payment creation)
  try {
    if (recipient.pushToken) {
      await sendPushPaymentNotification({
        status: paymentDetails.status,
        amount: paymentDetails.amount,
        orderId: paymentDetails.orderId,
      });
      results.push.success = true;
    }
  } catch (error: any) {
    console.error("Push notification error:", error);
    results.push.error = error.message;
  }

  return results;
}

/**
 * Send promotional messages
 */
export async function notifyPromotion(
  recipient: NotificationRecipient,
  promotionDetails: {
    title: string;
    message: string;
    offerCode?: string;
    offerDescription?: string;
    discountCode?: string;
    validUntil?: string;
    imageUrl?: string;
  }
) {
  const results = {
    push: { success: false, error: undefined as string | undefined },
    whatsapp: { success: false, error: undefined as string | undefined },
  };

  // Send push notification (WhatsApp handled by backend/scheduled functions if needed)
  try {
    if (recipient.pushToken) {
      await sendPushPromotionalNotification({
        title: promotionDetails.title,
        message: promotionDetails.message,
        offerCode: promotionDetails.offerCode,
        imageUrl: promotionDetails.imageUrl,
      });
      results.push.success = true;
    }
  } catch (error: any) {
    console.error("Push notification error:", error);
    results.push.error = error.message;
  }

  return results;
}

/**
 * Send daily menu updates
 */
export async function notifyDailyMenu(
  recipient: NotificationRecipient,
  menuDetails: {
    date: string;
    menuItems: string;
  }
) {
  const results = {
    push: { success: false, error: undefined as string | undefined },
    whatsapp: { success: false, error: undefined as string | undefined },
  };

  // Send push notification (WhatsApp handled by backend/scheduled functions if needed)
  try {
    if (recipient.pushToken) {
      await sendPushMenuUpdateNotification({
        date: menuDetails.date,
        menuItems: menuDetails.menuItems,
      });
      results.push.success = true;
    }
  } catch (error: any) {
    console.error("Push notification error:", error);
    results.push.error = error.message;
  }

  return results;
}

/**
 * Send wallet credit notifications
 */
export async function notifyWalletCredit(
  recipient: NotificationRecipient,
  walletDetails: {
    amount: string;
    reason: string;
    newBalance: string;
  }
) {
  const results = {
    push: { success: false, error: undefined as string | undefined },
    whatsapp: { success: false, error: undefined as string | undefined },
  };

  // Send push notification (WhatsApp handled by backend if needed)
  try {
    if (recipient.pushToken) {
      await sendPushWalletCreditNotification({
        amount: walletDetails.amount,
        reason: walletDetails.reason,
        newBalance: walletDetails.newBalance,
      });
      results.push.success = true;
    }
  } catch (error: any) {
    console.error("Push notification error:", error);
    results.push.error = error.message;
  }

  return results;
}

/**
 * Send referral reward notifications
 */
export async function notifyReferralReward(
  recipient: NotificationRecipient,
  referralDetails: {
    amount: string;
    referredUserName: string;
  }
) {
  const results = {
    push: { success: false, error: undefined as string | undefined },
    whatsapp: { success: false, error: undefined as string | undefined },
  };

  // Send push notification (WhatsApp handled by backend if needed)
  try {
    if (recipient.pushToken) {
      await sendPushReferralRewardNotification({
        amount: referralDetails.amount,
        referredUserName: referralDetails.referredUserName,
      });
      results.push.success = true;
    }
  } catch (error: any) {
    console.error("Push notification error:", error);
    results.push.error = error.message;
  }

  return results;
}

/**
 * Batch send notifications to multiple recipients
 */
export async function notifyBatch(
  recipients: NotificationRecipient[],
  notificationType:
    | "order"
    | "subscription"
    | "payment"
    | "promotion"
    | "menu"
    | "wallet"
    | "referral",
  details: any
) {
  const results = [];

  for (const recipient of recipients) {
    try {
      let result;
      switch (notificationType) {
        case "order":
          result = await notifyOrderUpdate(recipient, details);
          break;
        case "subscription":
          result = await notifySubscriptionUpdate(recipient, details);
          break;
        case "payment":
          result = await notifyPaymentStatus(recipient, details);
          break;
        case "promotion":
          result = await notifyPromotion(recipient, details);
          break;
        case "menu":
          result = await notifyDailyMenu(recipient, details);
          break;
        case "wallet":
          result = await notifyWalletCredit(recipient, details);
          break;
        case "referral":
          result = await notifyReferralReward(recipient, details);
          break;
        default:
          result = { push: { success: false }, whatsapp: { success: false } };
      }
      results.push({ recipient: recipient.userId, ...result });
    } catch (error: any) {
      console.error(`Batch notification error for ${recipient.userId}:`, error);
      results.push({
        recipient: recipient.userId,
        push: { success: false, error: error.message },
        whatsapp: { success: false, error: error.message },
      });
    }
  }

  return results;
}

export default {
  notifyOrderUpdate,
  notifySubscriptionUpdate,
  notifyPaymentStatus,
  notifyPromotion,
  notifyDailyMenu,
  notifyWalletCredit,
  notifyReferralReward,
  notifyBatch,
};
