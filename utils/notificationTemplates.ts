import {
  sendOrderNotification as sendPushOrderNotification,
  sendSubscriptionNotification as sendPushSubscriptionNotification,
  sendPaymentNotification as sendPushPaymentNotification,
  sendPromotionalNotification as sendPushPromotionalNotification,
  sendMenuUpdateNotification as sendPushMenuUpdateNotification,
  sendWalletCreditNotification as sendPushWalletCreditNotification,
  sendReferralRewardNotification as sendPushReferralRewardNotification,
} from "@/services/pushNotifications";

import {
  sendOrderNotification as sendWhatsAppOrderNotification,
  sendSubscriptionNotification as sendWhatsAppSubscriptionNotification,
  sendPaymentNotification as sendWhatsAppPaymentNotification,
  sendPromotionalMessage as sendWhatsAppPromotionalMessage,
  sendDailyMenuUpdate as sendWhatsAppDailyMenuUpdate,
  sendWalletCreditNotification as sendWhatsAppWalletCreditNotification,
} from "@/services/whatsapp";

/**
 * Unified notification handler that sends both push notifications and WhatsApp messages
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

  // Send push notification
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

  // Send WhatsApp message
  try {
    if (recipient.phone) {
      const whatsappResult = await sendWhatsAppOrderNotification(
        recipient.phone,
        {
          orderId: orderDetails.orderId,
          status: orderDetails.status,
          customerName: recipient.name,
          items: orderDetails.items,
          totalAmount: orderDetails.totalAmount,
          deliveryTime: orderDetails.deliveryTime,
          trackingUrl: orderDetails.trackingUrl,
        }
      );
      results.whatsapp.success = whatsappResult.success;
      results.whatsapp.error = whatsappResult.error;
    }
  } catch (error: any) {
    console.error("WhatsApp notification error:", error);
    results.whatsapp.error = error.message;
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

  // Send push notification
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

  // Send WhatsApp message
  try {
    if (recipient.phone) {
      const whatsappResult = await sendWhatsAppSubscriptionNotification(
        recipient.phone,
        {
          customerName: recipient.name,
          planName: subscriptionDetails.planName,
          status: subscriptionDetails.status,
          startDate: subscriptionDetails.startDate,
          endDate: subscriptionDetails.endDate,
          daysRemaining: subscriptionDetails.daysRemaining,
          renewalAmount: subscriptionDetails.renewalAmount,
        }
      );
      results.whatsapp.success = whatsappResult.success;
      results.whatsapp.error = whatsappResult.error;
    }
  } catch (error: any) {
    console.error("WhatsApp notification error:", error);
    results.whatsapp.error = error.message;
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

  // Send push notification
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

  // Send WhatsApp message
  try {
    if (recipient.phone) {
      const whatsappResult = await sendWhatsAppPaymentNotification(
        recipient.phone,
        {
          customerName: recipient.name,
          status: paymentDetails.status,
          amount: paymentDetails.amount,
          orderId: paymentDetails.orderId,
          transactionId: paymentDetails.transactionId,
          failureReason: paymentDetails.failureReason,
        }
      );
      results.whatsapp.success = whatsappResult.success;
      results.whatsapp.error = whatsappResult.error;
    }
  } catch (error: any) {
    console.error("WhatsApp notification error:", error);
    results.whatsapp.error = error.message;
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

  // Send push notification
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

  // Send WhatsApp message
  try {
    if (recipient.phone) {
      const whatsappResult = await sendWhatsAppPromotionalMessage(
        recipient.phone,
        {
          customerName: recipient.name,
          offerTitle: promotionDetails.title,
          offerDescription:
            promotionDetails.offerDescription || promotionDetails.message,
          discountCode:
            promotionDetails.discountCode || promotionDetails.offerCode,
          validUntil: promotionDetails.validUntil,
          imageUrl: promotionDetails.imageUrl,
        }
      );
      results.whatsapp.success = whatsappResult.success;
      results.whatsapp.error = whatsappResult.error;
    }
  } catch (error: any) {
    console.error("WhatsApp notification error:", error);
    results.whatsapp.error = error.message;
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

  // Send push notification
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

  // Send WhatsApp message
  try {
    if (recipient.phone) {
      const whatsappResult = await sendWhatsAppDailyMenuUpdate(
        recipient.phone,
        {
          customerName: recipient.name,
          menuItems: menuDetails.menuItems,
          date: menuDetails.date,
        }
      );
      results.whatsapp.success = whatsappResult.success;
      results.whatsapp.error = whatsappResult.error;
    }
  } catch (error: any) {
    console.error("WhatsApp notification error:", error);
    results.whatsapp.error = error.message;
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

  // Send push notification
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

  // Send WhatsApp message
  try {
    if (recipient.phone) {
      const whatsappResult = await sendWhatsAppWalletCreditNotification(
        recipient.phone,
        {
          customerName: recipient.name,
          amount: walletDetails.amount,
          reason: walletDetails.reason,
          newBalance: walletDetails.newBalance,
        }
      );
      results.whatsapp.success = whatsappResult.success;
      results.whatsapp.error = whatsappResult.error;
    }
  } catch (error: any) {
    console.error("WhatsApp notification error:", error);
    results.whatsapp.error = error.message;
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

  // Send push notification
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

  // Send WhatsApp message (can use wallet credit template)
  try {
    if (recipient.phone) {
      const whatsappResult = await sendWhatsAppWalletCreditNotification(
        recipient.phone,
        {
          customerName: recipient.name,
          amount: referralDetails.amount,
          reason: `Referral reward for ${referralDetails.referredUserName}`,
          newBalance: "Check your wallet",
        }
      );
      results.whatsapp.success = whatsappResult.success;
      results.whatsapp.error = whatsappResult.error;
    }
  } catch (error: any) {
    console.error("WhatsApp notification error:", error);
    results.whatsapp.error = error.message;
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
