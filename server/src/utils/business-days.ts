/**
 * Business day utility functions for payout grace period calculations.
 *
 * Business days are Monday through Friday.
 * No public holiday calendar — can be enhanced later if needed.
 */

/**
 * Check if a given date falls on a business day (Mon-Fri).
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/**
 * Subtract N business days from a reference date.
 *
 * Returns the date that is exactly N business days before `date`.
 * Used to calculate the earliest event end date eligible for auto-payout.
 *
 * @example
 * // If today is Wed Feb 12, subtracting 5 business days gives Wed Feb 5
 * subtractBusinessDays(new Date('2026-02-12'), 5) // => 2026-02-05
 */
export function subtractBusinessDays(date: Date, businessDays: number): Date {
  const result = new Date(date);
  let remaining = businessDays;

  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    if (isBusinessDay(result)) {
      remaining--;
    }
  }

  return result;
}

/**
 * Add N business days to a reference date.
 *
 * @example
 * // If date is Fri Feb 6, adding 1 business day gives Mon Feb 9
 * addBusinessDays(new Date('2026-02-06'), 1) // => 2026-02-09
 */
export function addBusinessDays(date: Date, businessDays: number): Date {
  const result = new Date(date);
  let remaining = businessDays;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      remaining--;
    }
  }

  return result;
}
