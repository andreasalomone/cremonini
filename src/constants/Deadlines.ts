/**
 * Business-critical deadline constants.
 * Centralized to avoid 'magic numbers' and ensure consistency between
 * the data layer, notification system, and dashboard KPIs.
 */
export const DEADLINES = {
  // Amount of time to notify before a deadline
  NOTIFY_RESERVE_DAYS_BEFORE: 3,
  NOTIFY_PRESCRIPTION_DAYS_BEFORE: 30,

  // Default calculation rules (Requirement Rule #2)
  RESERVE_DAYS: 7,
  PRESCRIPTION_YEARS: 1,

  // KPI/Audit thresholds
  CRITICAL_RESERVE_THRESHOLD_DAYS: 7,
  CRITICAL_PRESCRIPTION_THRESHOLD_DAYS: 30,
} as const;
