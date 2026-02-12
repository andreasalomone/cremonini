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

  describe('Strict Integer Mode', () => {
    it('removes dots (thousands separators): 1.234 -> 1234', () => {
      expect(sanitizeCurrency('1.234')).toBe('1234');
    });

    it('removes commas (treated as separators/ignored): 1,234 -> 1234', () => {
      expect(sanitizeCurrency('1,234')).toBe('1234');
    });

    it('handles mixed separators: 1.234,56 -> 123456', () => {
      // "No user will ever type cents", so 56 is part of the big number or just noise.
      // Current rule: strict strip => 123456.
      expect(sanitizeCurrency('1.234,56')).toBe('123456');
    });

    it('handles large numbers: 1.000.000 -> 1000000', () => {
      expect(sanitizeCurrency('1.000.000')).toBe('1000000');
    });

    it('handles plain integers: 1000 -> 1000', () => {
      expect(sanitizeCurrency('1000')).toBe('1000');
    });
  });

  describe('currency symbols and special characters', () => {
    it('removes euro symbol: €1.000 -> 1000', () => {
      expect(sanitizeCurrency('€1.000')).toBe('1000');
    });

    it('removes dollar symbol: $1,000 -> 1000', () => {
      expect(sanitizeCurrency('$1,000')).toBe('1000');
    });

    it('removes spaces: 1 000 -> 1000', () => {
      expect(sanitizeCurrency('1 000')).toBe('1000');
    });

    it('removes letters: EUR 1000 -> 1000', () => {
      expect(sanitizeCurrency('EUR 1000')).toBe('1000');
    });
  });

  describe('negative numbers', () => {
    it('preserves negative sign: -1.000 -> -1000', () => {
      expect(sanitizeCurrency('-1.000')).toBe('-1000');
    });
  });

  describe('edge cases', () => {
    it('handles single digit: 5 -> 5', () => {
      expect(sanitizeCurrency('5')).toBe('5');
    });

    it('handles zero: 0 -> 0', () => {
      expect(sanitizeCurrency('0')).toBe('0');
    });

    it('handles decimal-like leftovers: 0,50 -> 050', () => {
      // Strict integer mode just strips non-digits.
      // 0,50 -> 050.
      expect(sanitizeCurrency('0,50')).toBe('050');
    });
  });
});
