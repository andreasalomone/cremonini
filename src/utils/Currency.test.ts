import { describe, expect, it } from 'vitest';

import { sanitizeCurrency } from './Currency';

describe('sanitizeCurrency', () => {
  describe('null/undefined/empty handling', () => {
    it('returns null for null input', () => {
      expect(sanitizeCurrency(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(sanitizeCurrency(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(sanitizeCurrency('')).toBeNull();
    });
  });

  describe('European format (comma as decimal separator)', () => {
    it('converts simple European format: 1234,56 -> 1234.56', () => {
      expect(sanitizeCurrency('1234,56')).toBe('1234.56');
    });

    it('converts European format with thousands: 1.234,56 -> 1234.56', () => {
      expect(sanitizeCurrency('1.234,56')).toBe('1234.56');
    });

    it('converts large European numbers: 1.234.567,89 -> 1234567.89', () => {
      expect(sanitizeCurrency('1.234.567,89')).toBe('1234567.89');
    });

    it('handles European format without decimals: 1.234 (thousands) -> ambiguous, treated as decimal', () => {
      // When only dot is present, it's treated as decimal separator
      expect(sanitizeCurrency('1.234')).toBe('1.234');
    });
  });

  describe('US format (dot as decimal separator)', () => {
    it('keeps simple US format: 1234.56 -> 1234.56', () => {
      expect(sanitizeCurrency('1234.56')).toBe('1234.56');
    });

    it('converts US format with thousands: 1,234.56 -> 1234.56', () => {
      expect(sanitizeCurrency('1,234.56')).toBe('1234.56');
    });

    it('converts large US numbers: 1,234,567.89 -> 1234567.89', () => {
      expect(sanitizeCurrency('1,234,567.89')).toBe('1234567.89');
    });
  });

  describe('plain numbers (no separators)', () => {
    it('keeps integers unchanged: 1234 -> 1234', () => {
      expect(sanitizeCurrency('1234')).toBe('1234');
    });

    it('keeps simple decimals unchanged: 0.5 -> 0.5', () => {
      expect(sanitizeCurrency('0.5')).toBe('0.5');
    });
  });

  describe('currency symbols and special characters', () => {
    it('removes euro symbol: €1.234,56 -> 1234.56', () => {
      expect(sanitizeCurrency('€1.234,56')).toBe('1234.56');
    });

    it('removes dollar symbol: $1,234.56 -> 1234.56', () => {
      expect(sanitizeCurrency('$1,234.56')).toBe('1234.56');
    });

    it('removes spaces: 1 234,56 -> 1234.56', () => {
      expect(sanitizeCurrency('1 234,56')).toBe('1234.56');
    });

    it('removes letters: EUR 1234,56 -> 1234.56', () => {
      expect(sanitizeCurrency('EUR 1234,56')).toBe('1234.56');
    });
  });

  describe('negative numbers', () => {
    it('preserves negative sign: -1234,56 -> -1234.56', () => {
      expect(sanitizeCurrency('-1234,56')).toBe('-1234.56');
    });

    it('preserves negative with thousands: -1.234,56 -> -1234.56', () => {
      expect(sanitizeCurrency('-1.234,56')).toBe('-1234.56');
    });
  });

  describe('edge cases', () => {
    it('handles single digit: 5 -> 5', () => {
      expect(sanitizeCurrency('5')).toBe('5');
    });

    it('handles zero: 0 -> 0', () => {
      expect(sanitizeCurrency('0')).toBe('0');
    });

    it('handles decimal zero: 0,00 -> 0.00', () => {
      expect(sanitizeCurrency('0,00')).toBe('0.00');
    });

    it('handles only decimals: ,56 -> .56', () => {
      expect(sanitizeCurrency(',56')).toBe('.56');
    });

    it('handles trailing comma: 1234, -> 1234.', () => {
      expect(sanitizeCurrency('1234,')).toBe('1234.');
    });
  });

  describe('ambiguous formats (detection heuristic)', () => {
    // When both comma and dot are present, the last separator determines the format
    it('detects European when comma comes after dot: 1.234,56', () => {
      expect(sanitizeCurrency('1.234,56')).toBe('1234.56');
    });

    it('detects US when dot comes after comma: 1,234.56', () => {
      expect(sanitizeCurrency('1,234.56')).toBe('1234.56');
    });
  });
});
