/**
 * When the user taps "2-Day Trial" on a meal card, we set this flag before navigating.
 * The meal detail screen reads and consumes it on load so trial mode and 2-day plan
 * are applied even if URL params are not available (e.g. on some native stacks).
 */
let openInTrialMode = false;

export function setMealOpenInTrialMode(value: boolean): void {
  openInTrialMode = value;
}

/** Returns true if the meal screen should open in trial mode, then clears the flag. */
export function consumeMealOpenInTrialMode(): boolean {
  const value = openInTrialMode;
  openInTrialMode = false;
  return value;
}
