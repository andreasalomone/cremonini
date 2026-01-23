import { addDays, addMonths, addYears, differenceInDays } from 'date-fns';

import { DEADLINES } from '@/constants/Deadlines';
import type { Claim } from '@/models/Schema';
import { isHoliday } from '@/utils/Holidays';

type ClaimType = Claim['type'];
type ClaimState = Claim['state'];

export type CalculatedDeadlines = {
  prescriptionDeadline: Date;
  reserveDeadline: Date | null;
  claimFollowUpDeadline: Date | null;
  negotiationDeadline: Date | null;
  legalActionDeadline: Date;
  isDecadence: boolean; // True for Aria/Mare Int (non-interruptible)
  sitWarning?: string;
};

/**
 * Calculates legal deadlines based on the event date, claim type, and state.
 * Implements specific rules for:
 * - Terrestrial (National/International)
 * - Maritime (National/International)
 * - Air (All)
 * - Rail
 * - Stock in Transit (SIT)
 */
export function calculateDeadlines(
  params: {
    eventDate: Date;
    type: ClaimType;
    state: ClaimState;
    hasGrossNegligence?: boolean;
    stockInboundDate?: Date | null;
    stockOutboundDate?: Date | null;
    hasStockInboundReserve?: boolean;
  },
): CalculatedDeadlines {
  const {
    eventDate,
    type,
    state,
    hasGrossNegligence,
    stockInboundDate,
    stockOutboundDate,
    hasStockInboundReserve,
  } = params;

  // --- 1. SETTINGS & REGIME DETECTION ---
  const isTerrestrial = type === 'TERRESTRIAL' || type === 'TRANSPORT'; // Backwards compat
  const isNational = state === 'NATIONAL';
  const isAir = type === 'AIR';
  const isMaritime = type === 'MARITIME';
  const isRail = type === 'RAIL';
  const isSIT = type === 'STOCK_IN_TRANSIT' || type === 'STOCK';

  let isDecadence = false;
  let sitWarning: string | undefined;

  // --- 2. RESERVE DEADLINE (Danni Occulti) ---
  let reserveDays = 7; // Default
  let isWorkingDaysCalculation = false;

  if (isTerrestrial) {
    if (isNational) {
      reserveDays = DEADLINES.RESERVE_DAYS.TERRESTRIAL_NATIONAL;
    } else {
      reserveDays = DEADLINES.RESERVE_DAYS.TERRESTRIAL_INTERNATIONAL;
      isWorkingDaysCalculation = true; // CMR rules
    }
  } else if (isMaritime) {
    reserveDays = DEADLINES.RESERVE_DAYS.MARITIME;
  } else if (isAir) {
    reserveDays = DEADLINES.RESERVE_DAYS.AIR;
  } else if (isRail) {
    reserveDays = DEADLINES.RESERVE_DAYS.RAIL;
  } else if (isSIT) {
    reserveDays = DEADLINES.RESERVE_DAYS.STOCK_IN_TRANSIT;
  }

  let reserveDeadline: Date;

  if (isWorkingDaysCalculation) {
    // CMR logic: Skip Sundays and Holidays. Saturday is working.
    let count = 0;
    reserveDeadline = new Date(eventDate);
    while (count < reserveDays) {
      reserveDeadline.setDate(reserveDeadline.getDate() + 1);
      // Skip Sundays and Holidays (as per CMR "Sundays and other public holidays")
      if (!isHoliday(reserveDeadline)) {
        count++;
      }
    }
  } else {
    // Solare logic: Data + X days
    reserveDeadline = addDays(eventDate, reserveDays);
    // Art. 2963 C.C. - Roll-over to next working day if expires on Sunday/Holiday
    while (isHoliday(reserveDeadline)) {
      reserveDeadline.setDate(reserveDeadline.getDate() + 1);
    }
  }

  // --- 3. PRESCRIPTION / DECADENCE ---
  let prescriptionDeadline: Date;

  if (isAir) {
    prescriptionDeadline = addYears(eventDate, DEADLINES.PRESCRIPTION_YEARS.AIR);
    isDecadence = true;
  } else if (isMaritime) {
    if (isNational) {
      prescriptionDeadline = addMonths(eventDate, DEADLINES.PRESCRIPTION_MONTHS.MARITIME_NATIONAL);
    } else {
      prescriptionDeadline = addYears(eventDate, DEADLINES.PRESCRIPTION_YEARS.DEFAULT);
      isDecadence = true;
    }
  } else if (isTerrestrial && !isNational && hasGrossNegligence) {
    prescriptionDeadline = addYears(eventDate, DEADLINES.PRESCRIPTION_YEARS.CMR_GROSS_NEGLIGENCE);
  } else {
    prescriptionDeadline = addYears(eventDate, DEADLINES.PRESCRIPTION_YEARS.DEFAULT);
  }

  // --- 4. STOCK IN TRANSIT SPECIFIC LOGIC ---
  if (isSIT && stockInboundDate && stockOutboundDate) {
    const totalDays = differenceInDays(stockOutboundDate, stockInboundDate);
    if (totalDays > DEADLINES.SIT_INSURANCE_THRESHOLD_DAYS) {
      sitWarning = `ATTENZIONE: Copertura 'Transit' potenzialmente scaduta (${totalDays} gg). Verificare estensione 'Storage'.`;
    }

    if (!hasStockInboundReserve) {
      // Danno presumibilmente avvenuto in magazzino (Deposito)
      // Per sicurezza usiamo 1 anno come da prassi contrattuale, ma evidenziamo natura deposito
    }
  }

  // --- 5. LEGAL ACTION DEADLINE ---
  // 6 months before prescription (internal warning threshold)
  const legalActionDeadline = addMonths(prescriptionDeadline, -DEADLINES.LEGAL_ACTION_MONTHS);

  return {
    prescriptionDeadline,
    reserveDeadline,
    claimFollowUpDeadline: null,
    negotiationDeadline: null,
    legalActionDeadline,
    isDecadence,
    sitWarning,
  };
}

/**
 * Calculate extended deadlines based on status change.
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
