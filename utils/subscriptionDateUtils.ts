import { Subscription } from "@/types";

/**
 * Resolve weekend exclusion setting from subscription.
 * Handles both legacy (excludeWeekends boolean) and new (weekendExclusion string) formats.
 */
export function resolveWeekendExclusion(sub: Subscription): string {
  if (sub.weekType === "everyday") return "none";
  const fromNew = sub.weekendExclusion ?? null;
  if (fromNew) return fromNew;
  if (sub.excludeWeekends === true) return "both";
  return "none";
}

/**
 * Check if a date should be excluded based on subscription's weekend settings.
 */
export function isWeekendExcludedForDate(
  date: Date,
  sub: Subscription
): boolean {
  if (sub.weekType === "everyday") return false;
  const day = date.getDay();
  const setting = resolveWeekendExclusion(sub);
  if (setting === "both") return day === 0 || day === 6;
  if (setting === "saturday") return day === 6;
  if (setting === "sunday") return day === 0;
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
