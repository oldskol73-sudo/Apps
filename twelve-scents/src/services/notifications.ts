/**
 * Push types: order_shipped, subscription_upcoming (3 days prior), rewards_earned.
 * Real impl: expo-notifications registers a device token with the backend, which sends pushes. Locally we only
 * compute when the subscription reminder should fire.
 */
export const REMINDER_LEAD_DAYS = 3;
export function reminderDate(nextDateIso: string): Date {
  const d = new Date(nextDateIso);
  d.setDate(d.getDate() - REMINDER_LEAD_DAYS);
  return d;
}
