import { describe, expect, it } from 'vitest';

import { isHoliday, ITALIAN_HOLIDAYS } from './Holidays';

describe('ITALIAN_HOLIDAYS constant', () => {
  it('contains exactly 10 fixed national holidays', () => {
    expect(ITALIAN_HOLIDAYS).toHaveLength(10);
  });

  it('includes all expected holidays', () => {
    const expectedHolidays = [
      '01-01', // Capodanno
      '01-06', // Epifania
      '04-25', // Liberazione
      '05-01', // Lavoro
      '06-02', // Repubblica
      '08-15', // Ferragosto
      '11-01', // Ognissanti
      '12-08', // Immacolata
      '12-25', // Natale
      '12-26', // S. Stefano
    ];
    expectedHolidays.forEach((holiday) => {
      expect(ITALIAN_HOLIDAYS).toContain(holiday);
    });
  });
});

describe('isHoliday', () => {
  describe('Sundays (always holidays for legal purposes)', () => {
    it('returns true for a Sunday', () => {
      // 2026-01-04 is a Sunday
      expect(isHoliday(new Date('2026-01-04'))).toBe(true);
    });

    it('returns true for multiple Sundays in different months', () => {
      // 2026-02-01 is a Sunday
      expect(isHoliday(new Date('2026-02-01'))).toBe(true);
      // 2026-03-01 is a Sunday
      expect(isHoliday(new Date('2026-03-01'))).toBe(true);
    });
  });

  describe('Italian national holidays', () => {
    it('returns true for Capodanno (Jan 1)', () => {
      expect(isHoliday(new Date('2026-01-01'))).toBe(true);
      expect(isHoliday(new Date('2027-01-01'))).toBe(true);
    });

    it('returns true for Epifania (Jan 6)', () => {
      expect(isHoliday(new Date('2026-01-06'))).toBe(true);
    });

    it('returns true for Liberazione (Apr 25)', () => {
      expect(isHoliday(new Date('2026-04-25'))).toBe(true);
    });

    it('returns true for Festa del Lavoro (May 1)', () => {
      expect(isHoliday(new Date('2026-05-01'))).toBe(true);
    });

    it('returns true for Festa della Repubblica (Jun 2)', () => {
      expect(isHoliday(new Date('2026-06-02'))).toBe(true);
    });

    it('returns true for Ferragosto (Aug 15)', () => {
      expect(isHoliday(new Date('2026-08-15'))).toBe(true);
    });

    it('returns true for Ognissanti (Nov 1)', () => {
      expect(isHoliday(new Date('2026-11-01'))).toBe(true);
    });

    it('returns true for Immacolata (Dec 8)', () => {
      expect(isHoliday(new Date('2026-12-08'))).toBe(true);
    });

    it('returns true for Natale (Dec 25)', () => {
      expect(isHoliday(new Date('2026-12-25'))).toBe(true);
    });

    it('returns true for Santo Stefano (Dec 26)', () => {
      expect(isHoliday(new Date('2026-12-26'))).toBe(true);
    });
  });

  describe('regular working days', () => {
    it('returns false for a regular Monday', () => {
      // 2026-01-05 is a Monday
      expect(isHoliday(new Date('2026-01-05'))).toBe(false);
    });

    it('returns false for a regular Tuesday', () => {
      // 2026-01-13 is a Tuesday
      expect(isHoliday(new Date('2026-01-13'))).toBe(false);
    });

    it('returns false for a regular Wednesday', () => {
      // 2026-01-14 is a Wednesday
      expect(isHoliday(new Date('2026-01-14'))).toBe(false);
    });

    it('returns false for a regular Thursday', () => {
      // 2026-01-08 is a Thursday
      expect(isHoliday(new Date('2026-01-08'))).toBe(false);
    });

    it('returns false for a regular Friday', () => {
      // 2026-01-09 is a Friday
      expect(isHoliday(new Date('2026-01-09'))).toBe(false);
    });

    it('returns false for a regular Saturday', () => {
      // 2026-01-10 is a Saturday (not a legal holiday in Italy for business)
      expect(isHoliday(new Date('2026-01-10'))).toBe(false);
    });
  });

  describe('boundary conditions', () => {
    it('handles dates at year boundaries', () => {
      // Dec 31 is not a holiday (unless Sunday)
      // 2026-12-31 is a Thursday
      expect(isHoliday(new Date('2026-12-31'))).toBe(false);
    });

    it('correctly identifies holidays regardless of year', () => {
      // Test across multiple years
      [2024, 2025, 2026, 2027, 2030].forEach((year) => {
        expect(isHoliday(new Date(`${year}-12-25`))).toBe(true); // Natale
        expect(isHoliday(new Date(`${year}-01-01`))).toBe(true); // Capodanno
      });
    });

    it('handles dates with time components', () => {
      // Holiday at midnight
      expect(isHoliday(new Date('2026-12-25T00:00:00'))).toBe(true);
      // Holiday at noon
      expect(isHoliday(new Date('2026-12-25T12:00:00'))).toBe(true);
      // Holiday at end of day
      expect(isHoliday(new Date('2026-12-25T23:59:59'))).toBe(true);
    });

    it('handles single-digit months/days correctly', () => {
      // Tests that date formatting handles padding correctly
      // Jan 1 should match '01-01', not '1-1'
      expect(isHoliday(new Date('2026-01-01'))).toBe(true);
      // Jan 6 should match '01-06'
      expect(isHoliday(new Date('2026-01-06'))).toBe(true);
    });
  });

  describe('special cases where holiday falls on Sunday', () => {
    it('returns true when a national holiday falls on Sunday (double holiday)', () => {
      // When a holiday falls on Sunday, it's still a holiday
      // 2028-01-01 is a Saturday, so let's find when Jan 1 is a Sunday
      // 2023-01-01 was a Sunday
      const newYear2023 = new Date('2023-01-01');

      expect(newYear2023.getDay()).toBe(0); // Verify it's Sunday
      expect(isHoliday(newYear2023)).toBe(true);
    });
  });
});
