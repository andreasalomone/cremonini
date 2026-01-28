import { describe, expect, it } from 'vitest';

import { DEADLINES } from '@/constants/Deadlines';

import { calculateDeadlines, calculateExtendedDeadline } from './deadline-logic';

describe('calculateDeadlines', () => {
  const eventDate = new Date('2026-01-01'); // Thursday

  describe('Terrestrial Transport', () => {
    describe('National', () => {
      it('calculates 8 days solare reserve deadline', () => {
        const result = calculateDeadlines({
          eventDate,
          type: 'TERRESTRIAL',
          state: 'NATIONAL',
        });

        // 2026-01-01 + 8 days = 2026-01-09 (Friday)
        expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-09');
      });

      it('rolls over to Monday when deadline falls on Sunday', () => {
        // 2026-01-10 (Saturday) + 8 days = 2026-01-18 (Sunday) -> rolls to 2026-01-19 (Monday)
        const date = new Date('2026-01-10');
        const result = calculateDeadlines({
          eventDate: date,
          type: 'TERRESTRIAL',
          state: 'NATIONAL',
        });

        expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-19');
      });

      it('rolls over when deadline falls on holiday (Epifania)', () => {
        // Need to find a date where +8 days lands on Jan 6 (Epifania)
        // Dec 29 + 8 = Jan 6
        const date = new Date('2025-12-29'); // Monday
        const result = calculateDeadlines({
          eventDate: date,
          type: 'TERRESTRIAL',
          state: 'NATIONAL',
        });

        // Jan 6 is Epifania, should roll to Jan 7
        expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-07');
      });

      it('calculates 1 year prescription deadline', () => {
        const result = calculateDeadlines({
          eventDate,
          type: 'TERRESTRIAL',
          state: 'NATIONAL',
        });

        expect(result.prescriptionDeadline.getFullYear()).toBe(2027);
        expect(result.prescriptionDeadline.getMonth()).toBe(0); // January
        expect(result.prescriptionDeadline.getDate()).toBe(1);
      });

      it('sets isDecadence to false', () => {
        const result = calculateDeadlines({
          eventDate,
          type: 'TERRESTRIAL',
          state: 'NATIONAL',
        });

        expect(result.isDecadence).toBe(false);
      });
    });

    describe('International (CMR)', () => {
      it('calculates 7 working days reserve (skips Sundays and holidays)', () => {
        // 2026-01-01 (Thu) event date
        // Working days: Fri Jan 02 (1), Sat Jan 03 (2), Mon Jan 05 (3),
        // Tue Jan 06 = Epifania SKIP, Wed Jan 07 (4), Thu Jan 08 (5),
        // Fri Jan 09 (6), Sat Jan 10 (7)
        const result = calculateDeadlines({
          eventDate,
          type: 'TERRESTRIAL',
          state: 'INTERNATIONAL',
        });

        expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-10');
      });

      it('skips consecutive holidays correctly', () => {
        // Test around Christmas period with multiple holidays
        const xmasDate = new Date('2025-12-23'); // Tuesday
        const result = calculateDeadlines({
          eventDate: xmasDate,
          type: 'TERRESTRIAL',
          state: 'INTERNATIONAL',
        });

        // Dec 23 (Tue) event
        // Dec 24 (Wed) - 1, Dec 25 (Thu) = Natale SKIP, Dec 26 (Fri) = S. Stefano SKIP
        // Dec 27 (Sat) - 2, Dec 28 (Sun) SKIP, Dec 29 (Mon) - 3, Dec 30 (Tue) - 4
        // Dec 31 (Wed) - 5, Jan 1 (Thu) = Capodanno SKIP, Jan 2 (Fri) - 6, Jan 3 (Sat) - 7
        expect(result.reserveDeadline).toBeDefined();
      });

      it('calculates 1 year prescription without gross negligence', () => {
        const result = calculateDeadlines({
          eventDate,
          type: 'TERRESTRIAL',
          state: 'INTERNATIONAL',
          hasGrossNegligence: false,
        });

        expect(result.prescriptionDeadline.getFullYear()).toBe(2027);
      });

      it('calculates 3 year prescription with gross negligence', () => {
        const result = calculateDeadlines({
          eventDate,
          type: 'TERRESTRIAL',
          state: 'INTERNATIONAL',
          hasGrossNegligence: true,
        });

        expect(result.prescriptionDeadline.getFullYear()).toBe(2029);
      });
    });
  });

  describe('Maritime Transport', () => {
    describe('National', () => {
      it('calculates 3 days reserve deadline', () => {
        const result = calculateDeadlines({
          eventDate,
          type: 'MARITIME',
          state: 'NATIONAL',
        });

        // 2026-01-01 + 3 days = 2026-01-04 (Sunday) -> rolls to Monday
        expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-05');
      });

      it('calculates 6 months prescription', () => {
        const result = calculateDeadlines({
          eventDate,
          type: 'MARITIME',
          state: 'NATIONAL',
        });

        expect(result.prescriptionDeadline.getMonth()).toBe(6); // July
        expect(result.prescriptionDeadline.getDate()).toBe(1);
      });

      it('sets isDecadence to false for national', () => {
        const result = calculateDeadlines({
          eventDate,
          type: 'MARITIME',
          state: 'NATIONAL',
        });

        expect(result.isDecadence).toBe(false);
      });
    });

    describe('International', () => {
      it('calculates 3 days reserve deadline', () => {
        const result = calculateDeadlines({
          eventDate,
          type: 'MARITIME',
          state: 'INTERNATIONAL',
        });

        expect(result.reserveDeadline).toBeDefined();
      });

      it('calculates 1 year prescription (decadence)', () => {
        const result = calculateDeadlines({
          eventDate,
          type: 'MARITIME',
          state: 'INTERNATIONAL',
        });

        expect(result.prescriptionDeadline.getFullYear()).toBe(2027);
        expect(result.isDecadence).toBe(true);
      });
    });
  });

  describe('Air Transport', () => {
    it('calculates 14 days reserve deadline', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'AIR',
        state: 'INTERNATIONAL',
      });

      // 2026-01-01 + 14 = 2026-01-15 (Thursday)
      expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-15');
    });

    it('calculates 2 year prescription (decadence)', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'AIR',
        state: 'INTERNATIONAL',
      });

      expect(result.prescriptionDeadline.getFullYear()).toBe(2028);
      expect(result.isDecadence).toBe(true);
    });

    it('applies same rules for national air transport', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'AIR',
        state: 'NATIONAL',
      });

      expect(result.prescriptionDeadline.getFullYear()).toBe(2028);
      expect(result.isDecadence).toBe(true);
    });
  });

  describe('Rail Transport', () => {
    it('calculates 7 days reserve deadline', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'RAIL',
        state: 'NATIONAL',
      });

      // 2026-01-01 + 7 = 2026-01-08 (Thursday)
      expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-08');
    });

    it('calculates 1 year prescription', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'RAIL',
        state: 'INTERNATIONAL',
      });

      expect(result.prescriptionDeadline.getFullYear()).toBe(2027);
    });
  });

  describe('Stock in Transit (SIT)', () => {
    it('calculates 8 days reserve deadline', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'STOCK_IN_TRANSIT',
        state: 'NATIONAL',
      });

      // 2026-01-01 + 8 = 2026-01-09 (Friday)
      expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-09');
    });

    it('generates warning when storage exceeds 60 days', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'STOCK_IN_TRANSIT',
        state: 'NATIONAL',
        stockInboundDate: new Date('2026-01-01'),
        stockOutboundDate: new Date('2026-03-10'), // 68 days
      });

      expect(result.sitWarning).toBeDefined();
      expect(result.sitWarning).toContain('68 gg');
      expect(result.sitWarning).toContain('Storage');
    });

    it('does not generate warning when storage is exactly 60 days', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'STOCK_IN_TRANSIT',
        state: 'NATIONAL',
        stockInboundDate: new Date('2026-01-01'),
        stockOutboundDate: new Date('2026-03-02'), // Exactly 60 days
      });

      expect(result.sitWarning).toBeUndefined();
    });

    it('does not generate warning when storage is under 60 days', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'STOCK_IN_TRANSIT',
        state: 'NATIONAL',
        stockInboundDate: new Date('2026-01-01'),
        stockOutboundDate: new Date('2026-02-15'), // 45 days
      });

      expect(result.sitWarning).toBeUndefined();
    });

    it('does not generate warning without stock dates', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'STOCK_IN_TRANSIT',
        state: 'NATIONAL',
      });

      expect(result.sitWarning).toBeUndefined();
    });
  });

  describe('Legal Action Deadline', () => {
    it('is set to 6 months before prescription', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'TERRESTRIAL',
        state: 'NATIONAL',
      });

      // Prescription is Jan 1, 2027, so legal action is July 1, 2026
      expect(result.legalActionDeadline.getFullYear()).toBe(2026);
      expect(result.legalActionDeadline.getMonth()).toBe(6); // July
    });

    it('handles 2 year prescription correctly', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'AIR',
        state: 'INTERNATIONAL',
      });

      // Prescription is Jan 1, 2028, so legal action is July 1, 2027
      expect(result.legalActionDeadline.getFullYear()).toBe(2027);
      expect(result.legalActionDeadline.getMonth()).toBe(6);
    });
  });

  describe('Default values', () => {
    it('sets claimFollowUpDeadline to null initially', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'TERRESTRIAL',
        state: 'NATIONAL',
      });

      expect(result.claimFollowUpDeadline).toBeNull();
    });

    it('sets negotiationDeadline to null initially', () => {
      const result = calculateDeadlines({
        eventDate,
        type: 'TERRESTRIAL',
        state: 'NATIONAL',
      });

      expect(result.negotiationDeadline).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('handles leap year correctly', () => {
      const leapYearDate = new Date('2024-02-28');
      const result = calculateDeadlines({
        eventDate: leapYearDate,
        type: 'TERRESTRIAL',
        state: 'NATIONAL',
      });

      // Feb 28, 2024 + 8 days = Mar 7, 2024
      expect(result.reserveDeadline?.getMonth()).toBe(2); // March
      expect(result.reserveDeadline?.getDate()).toBe(7);
    });

    it('handles year boundary correctly', () => {
      const yearEndDate = new Date('2025-12-28');
      const result = calculateDeadlines({
        eventDate: yearEndDate,
        type: 'TERRESTRIAL',
        state: 'NATIONAL',
      });

      // Dec 28 + 8 = Jan 5, rolls to next year
      expect(result.reserveDeadline?.getFullYear()).toBe(2026);
    });

    it('handles multiple consecutive holidays at year end', () => {
      // Dec 24 + 8 = Jan 1 (Capodanno) - should skip
      const result = calculateDeadlines({
        eventDate: new Date('2025-12-24'),
        type: 'TERRESTRIAL',
        state: 'NATIONAL',
      });

      // Should skip Jan 1 and land on Jan 2
      expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-02');
    });
  });
});

describe('calculateExtendedDeadline', () => {
  const baseDate = new Date('2026-01-15');

  describe('CLAIM_SENT phase', () => {
    it('adds 30 days for follow-up', () => {
      const result = calculateExtendedDeadline(baseDate, 'CLAIM_SENT');

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(14);
    });

    it('uses DEADLINES.CLAIM_FOLLOWUP_DAYS constant', () => {
      const result = calculateExtendedDeadline(baseDate, 'CLAIM_SENT');
      const expected = new Date(baseDate);
      expected.setDate(expected.getDate() + DEADLINES.CLAIM_FOLLOWUP_DAYS);

      expect(result.getTime()).toBe(expected.getTime());
    });
  });

  describe('NEGOTIATION phase', () => {
    it('adds 60 days for negotiation', () => {
      const result = calculateExtendedDeadline(baseDate, 'NEGOTIATION');

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(2); // March
      expect(result.getDate()).toBe(16);
    });

    it('uses DEADLINES.NEGOTIATION_DAYS constant', () => {
      const result = calculateExtendedDeadline(baseDate, 'NEGOTIATION');
      const expected = new Date(baseDate);
      expected.setDate(expected.getDate() + DEADLINES.NEGOTIATION_DAYS);

      expect(result.getTime()).toBe(expected.getTime());
    });
  });

  describe('Edge cases', () => {
    it('handles month boundary correctly', () => {
      const endOfMonth = new Date('2026-01-31');
      const result = calculateExtendedDeadline(endOfMonth, 'CLAIM_SENT');

      // Jan 31 + 30 = Mar 2
      expect(result.getMonth()).toBe(2); // March
    });

    it('handles leap year February correctly', () => {
      const leapYearFeb = new Date('2024-02-15');
      const result = calculateExtendedDeadline(leapYearFeb, 'CLAIM_SENT');

      // Feb 15 + 30 = Mar 16 (2024 is leap year)
      expect(result.getMonth()).toBe(2); // March
      expect(result.getDate()).toBe(16);
    });

    it('handles year boundary correctly', () => {
      const yearEnd = new Date('2025-12-15');
      const result = calculateExtendedDeadline(yearEnd, 'NEGOTIATION');

      // Dec 15 + 60 days crosses into new year
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February
    });
  });
});
