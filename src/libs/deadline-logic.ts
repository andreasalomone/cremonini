import { addDays, addYears } from 'date-fns';

import { DEADLINES } from '@/constants/Deadlines';
import type { claimsSchema } from '@/models/Schema';

type ClaimType = typeof claimsSchema.$inferSelect.type;

/**
 * Calculates legal deadlines based on the event date and claim type.
 *
 * Rules:
 * 1. Prescription (All): Event Date + 1 Year
 * 2. Reserve (Transport/Deposit): Event Date + 7 Days (Deposit as safety alert)
 */
export function calculateDeadlines(eventDate: Date, type: ClaimType) {
  const prescriptionDeadline = addYears(eventDate, DEADLINES.PRESCRIPTION_YEARS);

  // Requirement Rule #2: Reserve logic
  const isReserveApplicable = type === 'TRANSPORT' || type === 'DEPOSIT';
  const reserveDeadline = isReserveApplicable
    ? addDays(eventDate, DEADLINES.RESERVE_DAYS)
    : null;

  return {
    prescriptionDeadline,
    reserveDeadline,
  };
}
