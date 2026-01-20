import { addDays, addMonths, addYears } from 'date-fns';

import { DEADLINES } from '@/constants/Deadlines';
import type { claimsSchema } from '@/models/Schema';

type ClaimType = typeof claimsSchema.$inferSelect.type;

export type CalculatedDeadlines = {
  prescriptionDeadline: Date;
  reserveDeadline: Date | null;
  claimFollowUpDeadline: Date | null;
  negotiationDeadline: Date | null;
  legalActionDeadline: Date;
};

/**
 * Calculates legal deadlines based on the event date and claim type.
 *
 * Rules:
 * 1. Prescription (All): Event Date + 1 Year
 * 2. Reserve (Transport/Deposit): Event Date + 7 Days (Deposit as safety alert)
 * 3. Claim Follow-Up: When claim is sent, add 30 days for follow-up
 * 4. Negotiation: When entering negotiation, add 60 days
 * 5. Legal Action: 6 months before prescription deadline
 */
export function calculateDeadlines(eventDate: Date, type: ClaimType): CalculatedDeadlines {
  const prescriptionDeadline = addYears(eventDate, DEADLINES.PRESCRIPTION_YEARS);

  // Requirement Rule #2: Reserve logic
  const isReserveApplicable = type === 'TRANSPORT' || type === 'DEPOSIT';
  const reserveDeadline = isReserveApplicable
    ? addDays(eventDate, DEADLINES.RESERVE_DAYS)
    : null;

  // Legal action deadline: 6 months before prescription
  const legalActionDeadline = addMonths(prescriptionDeadline, -DEADLINES.LEGAL_ACTION_MONTHS);

  return {
    prescriptionDeadline,
    reserveDeadline,
    claimFollowUpDeadline: null, // Set when claim is sent
    negotiationDeadline: null, // Set when entering negotiation
    legalActionDeadline,
  };
}

/**
 * Calculate extended deadlines based on status change.
 * Called when claim status changes to set phase-specific deadlines.
 */
export function calculateExtendedDeadline(
  fromDate: Date,
  targetPhase: 'CLAIM_SENT' | 'NEGOTIATION',
): Date {
  switch (targetPhase) {
    case 'CLAIM_SENT':
      return addDays(fromDate, DEADLINES.CLAIM_FOLLOWUP_DAYS);
    case 'NEGOTIATION':
      return addDays(fromDate, DEADLINES.NEGOTIATION_DAYS);
    default:
      return fromDate;
  }
}
