import { describe, expect, it } from 'vitest';

import { calculateDeadlines } from './deadline-logic';

describe('calculateDeadlines', () => {
  const eventDate = new Date('2026-01-01'); // Thursday

  it('calculates Terrestrial National (8 days solare, Sunday rollover)', () => {
    // 2026-01-01 + 8 days = 2026-01-09 (Friday).
    // If it was expiring on Sunday Jan 11, it would roll over to Monday Jan 12.
    // Let's pick a date that expires on a Sunday.
    const date = new Date('2026-01-10'); // Saturday
    // + 8 days = 2026-01-18 (Sunday)
    const result = calculateDeadlines({
      eventDate: date,
      type: 'TERRESTRIAL',
      state: 'NATIONAL',
    });

    expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-19'); // Monday rollover
    expect(result.prescriptionDeadline.getFullYear()).toBe(2027);
  });

  it('calculates Terrestrial International (7 working days CMR)', () => {
    // 2026-01-01 (Thu)
    // Fri Jan 02 (1)
    // Sat Jan 03 (2)
    // Sun Jan 04 (Skip)
    // Mon Jan 05 (3)
    // Tue Jan 06 (Skip - Epifania)
    // Wed Jan 07 (4)
    // Thu Jan 08 (5)
    // Fri Jan 09 (6)
    // Sat Jan 10 (7)
    const result = calculateDeadlines({
      eventDate,
      type: 'TERRESTRIAL',
      state: 'INTERNATIONAL',
    });

    expect(result.reserveDeadline?.toISOString().split('T')[0]).toBe('2026-01-10');
  });

  it('calculates Air (14 days, 2 year decadence)', () => {
    const result = calculateDeadlines({
      eventDate,
      type: 'AIR',
      state: 'INTERNATIONAL',
    });

    expect(result.prescriptionDeadline.getFullYear()).toBe(2028);
    expect(result.isDecadence).toBe(true);
  });

  it('calculates Maritime National (3 days, 6 month prescription)', () => {
    const result = calculateDeadlines({
      eventDate,
      type: 'MARITIME',
      state: 'NATIONAL',
    });

    expect(result.prescriptionDeadline.getMonth()).toBe(6); // July
  });

  it('handles CMR Gross Negligence (3 year extension)', () => {
    const result = calculateDeadlines({
      eventDate,
      type: 'TERRESTRIAL',
      state: 'INTERNATIONAL',
      hasGrossNegligence: true,
    });

    expect(result.prescriptionDeadline.getFullYear()).toBe(2029);
  });

  it('flags SIT insurance warning (> 60 days)', () => {
    const result = calculateDeadlines({
      eventDate,
      type: 'STOCK_IN_TRANSIT',
      state: 'NATIONAL',
      stockInboundDate: new Date('2026-01-01'),
      stockOutboundDate: new Date('2026-03-10'), // More than 60 days
    });

    expect(result.sitWarning).toBeDefined();
    expect(result.sitWarning).toContain('68 gg');
  });
});
