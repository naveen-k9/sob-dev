/**
 * Centralized Cut-Off Time Utilities
 * 
 * This module provides consistent cut-off time validation across the app.
 * Used by: Orders screen, Add-ons modal, Calendar, Checkout
 */

import { AppSettings } from "@/types";

export interface CutoffCheckResult {
  canProceed: boolean;
  reason?: string;
  cutoffTime?: string;
  minutesRemaining?: number;
}

/**
 * Check if a meal can be skipped for a given date
 * @param date - The date to check
 * @param appSettings - Application settings containing skipCutoffTime
 * @returns CutoffCheckResult with canProceed flag and additional info
 */
export function canSkipMeal(
  date: Date,
  appSettings: AppSettings | null
): CutoffCheckResult {
  if (!appSettings?.skipCutoffTime) {
    return {
      canProceed: false,
      reason: "Cut-off time not configured",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  // Future dates can always be skipped
  if (checkDate > today) {
    return {
      canProceed: true,
      reason: "Future date",
    };
  }

  // Past dates cannot be skipped
  if (checkDate < today) {
    return {
      canProceed: false,
      reason: "Cannot skip past dates",
    };
  }

  // For today, check against cut-off time
  try {
    const cutoffTimeStr = appSettings.skipCutoffTime.toString();
    const [cutoffHour, cutoffMinute] = cutoffTimeStr.split(":").map(Number);

    if (isNaN(cutoffHour) || isNaN(cutoffMinute)) {
      return {
        canProceed: false,
        reason: "Invalid cut-off time format",
      };
    }

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0);
    const currentTime = new Date();

    const canSkip = currentTime < cutoffTime;
    const minutesRemaining = canSkip
      ? Math.floor((cutoffTime.getTime() - currentTime.getTime()) / 60000)
      : 0;

    return {
      canProceed: canSkip,
      reason: canSkip
        ? `Can skip until ${cutoffTimeStr}`
        : `Cut-off time (${cutoffTimeStr}) has passed`,
      cutoffTime: cutoffTimeStr,
      minutesRemaining,
    };
  } catch (error) {
    console.error("Error checking skip cutoff time:", error);
    return {
      canProceed: false,
      reason: "Error checking cut-off time",
    };
  }
}

/**
 * Check if add-ons can be added/modified for a given date
 * @param date - The date to check
 * @param appSettings - Application settings containing addOnCutoffTime
 * @returns CutoffCheckResult with canProceed flag and additional info
 */
export function canModifyAddOns(
  date: Date,
  appSettings: AppSettings | null
): CutoffCheckResult {
  if (!appSettings?.addOnCutoffTime) {
    return {
      canProceed: false,
      reason: "Add-on cut-off time not configured",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  // Future dates can always be modified
  if (checkDate > today) {
    return {
      canProceed: true,
      reason: "Future date",
    };
  }

  // Past dates cannot be modified
  if (checkDate < today) {
    return {
      canProceed: false,
      reason: "Cannot modify past dates",
    };
  }

  // For today, check against cut-off time
  try {
    const cutoffTimeStr = appSettings.addOnCutoffTime.toString();
    const [cutoffHour, cutoffMinute] = cutoffTimeStr.split(":").map(Number);

    if (isNaN(cutoffHour) || isNaN(cutoffMinute)) {
      return {
        canProceed: false,
        reason: "Invalid add-on cut-off time format",
      };
    }

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0);
    const currentTime = new Date();

    const canModify = currentTime < cutoffTime;
    const minutesRemaining = canModify
      ? Math.floor((cutoffTime.getTime() - currentTime.getTime()) / 60000)
      : 0;

    return {
      canProceed: canModify,
      reason: canModify
        ? `Can modify until ${cutoffTimeStr}`
        : `Add-on cut-off time (${cutoffTimeStr}) has passed`,
      cutoffTime: cutoffTimeStr,
      minutesRemaining,
    };
  } catch (error) {
    console.error("Error checking add-on cutoff time:", error);
    return {
      canProceed: false,
      reason: "Error checking add-on cut-off time",
    };
  }
}

/**
 * Check if an order can be placed for a given delivery time
 * @param deliveryTime - The intended delivery time
 * @param appSettings - Application settings containing orderCutoffTime
 * @returns CutoffCheckResult with canProceed flag and additional info
 */
export function canPlaceOrder(
  deliveryTime: Date,
  appSettings: AppSettings | null
): CutoffCheckResult {
  if (!appSettings?.orderCutoffTime) {
    return {
      canProceed: false,
      reason: "Order cut-off time not configured",
    };
  }

  const today = new Date();
  const deliveryDate = new Date(deliveryTime);
  deliveryDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // Orders for future dates can always be placed
  if (deliveryDate > today) {
    return {
      canProceed: true,
      reason: "Future delivery date",
    };
  }

  // For same-day delivery, check against cut-off time
  if (deliveryDate.getTime() === today.getTime()) {
    try {
      const cutoffTimeStr = appSettings.orderCutoffTime.toString();
      const [cutoffHour, cutoffMinute] = cutoffTimeStr.split(":").map(Number);

      if (isNaN(cutoffHour) || isNaN(cutoffMinute)) {
        return {
          canProceed: false,
          reason: "Invalid order cut-off time format",
        };
      }

      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0);
      const currentTime = new Date();

      const canOrder = currentTime < cutoffTime;
      const minutesRemaining = canOrder
        ? Math.floor((cutoffTime.getTime() - currentTime.getTime()) / 60000)
        : 0;

      return {
        canProceed: canOrder,
        reason: canOrder
          ? `Can order until ${cutoffTimeStr}`
          : `Order cut-off time (${cutoffTimeStr}) has passed for today. Try scheduling for tomorrow.`,
        cutoffTime: cutoffTimeStr,
        minutesRemaining,
      };
    } catch (error) {
      console.error("Error checking order cutoff time:", error);
      return {
        canProceed: false,
        reason: "Error checking order cut-off time",
      };
    }
  }

  // Cannot place orders for past dates
  return {
    canProceed: false,
    reason: "Cannot place orders for past dates",
  };
}

/**
 * Format minutes remaining into a human-readable string
 * @param minutes - Number of minutes remaining
 * @returns Formatted string (e.g., "2h 30m" or "45m")
 */
export function formatTimeRemaining(minutes: number): string {
  if (minutes <= 0) return "0m";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  return `${mins}m`;
}

/**
 * Get user-friendly cut-off message for UI display
 * @param result - CutoffCheckResult from canSkipMeal, canModifyAddOns, or canPlaceOrder
 * @param action - The action being attempted (e.g., "skip meal", "add items")
 * @returns User-friendly message string
 */
export function getCutoffMessage(
  result: CutoffCheckResult,
  action: string
): string {
  if (result.canProceed && result.minutesRemaining) {
    if (result.minutesRemaining <= 30) {
      return `⏰ Hurry! Only ${formatTimeRemaining(result.minutesRemaining)} left to ${action}`;
    }
    if (result.minutesRemaining <= 120) {
      return `You can ${action} until ${result.cutoffTime}`;
    }
    return `Available until ${result.cutoffTime}`;
  }
  
  return result.reason || `Cannot ${action}`;
}
