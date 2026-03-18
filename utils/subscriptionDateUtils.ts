import { Subscription } from "@/types";

/**
 * Check if a date should be excluded based on subscription's weekend settings.
 */
export function isWeekendExcludedForDate(
  date: Date,
  sub: Subscription
): boolean {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (sub.weekType === "everyday") return false;
  if (sub.weekType === "mon-fri") return day === 0 || day === 6;
  if (sub.weekType === "mon-sat") return day === 0;
  if (sub.weekType === "none") return true;
  return false;
}

/**
 * Returns true if the given date is an active delivery day for the subscription
 * (within start/end, not skipped, respects weekend exclusion, and is one of the
 * planned delivery days based on duration/totalDeliveries).
 */
export function isActivePlanDate(
  date: Date,
  subscription: Subscription
): boolean {
  const subStart = new Date(subscription.startDate);
  const subEnd = new Date(subscription.endDate);
  subStart.setHours(0, 0, 0, 0);
  subEnd.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate < subStart || checkDate > subEnd) return false;
  if (isWeekendExcludedForDate(checkDate, subscription)) return false;

  const totalDeliveries =
    subscription.duration ?? subscription.totalDeliveries ?? 0;
  let currentDeliveryDate = new Date(subStart);
  let deliveredCount = 0;

  while (currentDeliveryDate <= subEnd && deliveredCount < totalDeliveries) {
    const currentDateString = currentDeliveryDate.toISOString().split("T")[0];
    const currentIsSkipped =
      subscription.skippedDates?.includes(currentDateString) ?? false;

    if (isWeekendExcludedForDate(currentDeliveryDate, subscription)) {
      currentDeliveryDate.setDate(currentDeliveryDate.getDate() + 1);
      continue;
    }

    if (
      currentDeliveryDate.getTime() === checkDate.getTime() &&
      !currentIsSkipped
    ) {
      return true;
    }

    if (!currentIsSkipped) deliveredCount++;
    currentDeliveryDate.setDate(currentDeliveryDate.getDate() + 1);
  }

  return false;
}

/** User-facing status for a calendar/delivery day. */
export type DeliveryDayStatus =
  | "delivered"
  | "upcoming"
  | "skipped"
  | "vacation"
  | "missed";

/**
 * Derive user-facing day status from subscription data.
 * When delivery person marks delivery_missed, this returns "missed".
 */
export function getDeliveryDayStatus(
  date: Date,
  subscription: Subscription
): DeliveryDayStatus {
  const dateString = date.toISOString().split("T")[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (isWeekendExcludedForDate(checkDate, subscription)) return "vacation";
  if (subscription.skippedDates?.includes(dateString)) return "skipped";
  if (!isActivePlanDate(checkDate, subscription)) return "upcoming";

  const deliveryStatus = subscription.deliveryStatusByDate?.[dateString];
  const isPast = checkDate.getTime() < today.getTime();

  if (deliveryStatus === "delivery_done") return "delivered";
  if (deliveryStatus === "delivery_missed" || isPast) return "missed";
  return "upcoming";
}
