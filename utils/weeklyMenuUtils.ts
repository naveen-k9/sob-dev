import { Meal } from "@/types";

export const DAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type DayKey = (typeof DAY_KEYS)[number];

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/**
 * Returns which weekdays are valid delivery days for this meal based on
 * availableWeekTypes (and thus which days the admin should be able to set
 * weekly menu for). Union of all selected week types.
 * - mon-fri → Mon–Fri
 * - mon-sat → Mon–Sat
 * - everyday → Mon–Sun
 * - If none set, all 7 days are allowed.
 */
export function getDeliveryDayKeysForMeal(
  meal: Meal
): DayKey[] {
  const types = meal.availableWeekTypes;
  if (!types || types.length === 0) return [...DAY_KEYS];

  const set = new Set<DayKey>();
  if (types.includes("everyday")) {
    DAY_KEYS.forEach((d) => set.add(d));
    return [...set];
  }
  const monFri: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
  const monSat: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat"];
  if (types.includes("mon-fri")) monFri.forEach((d) => set.add(d));
  if (types.includes("mon-sat")) monSat.forEach((d) => set.add(d));
  return DAY_KEYS.filter((d) => set.has(d));
}

export function getDayLabel(day: DayKey): string {
  return DAY_LABELS[day];
}
