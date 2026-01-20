/**
 * Business-critical deadline constants.
 * Centralized to avoid 'magic numbers' and ensure consistency between
 * the data layer, notification system, and dashboard KPIs.
 */
export const DEADLINES = {
  // Amount of time to notify before a deadline
  NOTIFY_RESERVE_DAYS_BEFORE: 3,
  NOTIFY_PRESCRIPTION_DAYS_BEFORE: 30,
  NOTIFY_FOLLOWUP_DAYS_BEFORE: 7,
  NOTIFY_NEGOTIATION_DAYS_BEFORE: 14,

  // Default calculation rules (Requirement Rule #2)
  RESERVE_DAYS: 7,
  PRESCRIPTION_YEARS: 1,

  // Extended deadline intervals (Phase 7)
  CLAIM_FOLLOWUP_DAYS: 30, // Days after claim sent to follow up
  NEGOTIATION_DAYS: 60, // Days for negotiation phase
  LEGAL_ACTION_MONTHS: 6, // Months before prescription to consider legal action

  // KPI/Audit thresholds
  CRITICAL_RESERVE_THRESHOLD_DAYS: 7,
  CRITICAL_PRESCRIPTION_THRESHOLD_DAYS: 30,
} as const;
