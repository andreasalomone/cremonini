/**
 * Constants for economic calculations.
 * Centralized here to respect DRY and YAGNI.
 */
export const ECONOMICS = {
  // Total aggregate deductible for the group per year
  ANNUAL_AGGREGATE_DEDUCTIBLE: 3500000,

  // Threshold for alerting when the deductible is low (10%)
  DEDUCTIBLE_LOW_THRESHOLD: 0.1,

  // Currency formatting options
  CURRENCY_FORMAT: {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  },
} as const;
