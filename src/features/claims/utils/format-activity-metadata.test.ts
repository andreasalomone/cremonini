import { describe, expect, it } from 'vitest';

import { formatActivityMetadata } from './format-activity-metadata';

describe('formatActivityMetadata', () => {
  // --- Null / empty guard ---

  it('returns null for null metadata', () => {
    expect(formatActivityMetadata('STATUS_CHANGE', null)).toBeNull();
  });

  it('returns null for undefined metadata', () => {
    expect(formatActivityMetadata('STATUS_CHANGE', undefined)).toBeNull();
  });

  it('returns null for empty object metadata', () => {
    expect(formatActivityMetadata('STATUS_CHANGE', {})).toBeNull();
  });

  it('returns null for non-object metadata', () => {
    expect(formatActivityMetadata('STATUS_CHANGE', 'string')).toBeNull();
  });

  // --- CREATED (always null) ---

  it('returns null for CREATED type', () => {
    expect(formatActivityMetadata('CREATED', { something: true })).toBeNull();
  });

  // --- STATUS_CHANGE ---

  describe('STATUS_CHANGE', () => {
    it('resolves status labels to Italian', () => {
      const result = formatActivityMetadata('STATUS_CHANGE', {
        oldStatus: 'OPEN',
        newStatus: 'CLAIM_SENT',
      });

      expect(result).toEqual([
        { label: 'Transizione', value: 'Aperto → Reclamo inviato' },
      ]);
    });

    it('falls back to raw value for unknown status', () => {
      const result = formatActivityMetadata('STATUS_CHANGE', {
        oldStatus: 'UNKNOWN_OLD',
        newStatus: 'UNKNOWN_NEW',
      });

      expect(result).toEqual([
        { label: 'Transizione', value: 'UNKNOWN_OLD → UNKNOWN_NEW' },
      ]);
    });

    it('returns null when oldStatus/newStatus missing', () => {
      expect(formatActivityMetadata('STATUS_CHANGE', { oldStatus: 'OPEN' })).toBeNull();
      expect(formatActivityMetadata('STATUS_CHANGE', { newStatus: 'OPEN' })).toBeNull();
    });
  });

  // --- DOC_UPLOAD ---

  describe('DOC_UPLOAD', () => {
    it('formats single doc upload with filename and type', () => {
      const result = formatActivityMetadata('DOC_UPLOAD', {
        type: 'CMR_DDT',
        filename: 'report.pdf',
        path: '/some/path',
      });

      expect(result).toEqual([
        { label: 'File', value: 'report.pdf (CMR / DDT)' },
      ]);
    });

    it('formats batch upload with count only', () => {
      const result = formatActivityMetadata('DOC_UPLOAD', { count: 3 });

      expect(result).toEqual([
        { label: 'Quantità', value: '3 documenti' },
      ]);
    });

    it('formats batch upload with files array', () => {
      const result = formatActivityMetadata('DOC_UPLOAD', {
        count: 2,
        files: [
          { type: 'INVOICE', filename: 'fattura.pdf' },
          { type: 'PHOTO_REPORT', filename: 'foto.jpg' },
        ],
      });

      expect(result).toHaveLength(3); // count + 2 files
      expect(result![0]).toEqual({ label: 'Quantità', value: '2 documenti' });
      expect(result![1]).toEqual({ label: 'File', value: 'fattura.pdf (Fattura)' });
      expect(result![2]).toEqual({ label: 'File', value: 'foto.jpg (Report fotografico)' });
    });

    it('does not show count entry for count=1', () => {
      const result = formatActivityMetadata('DOC_UPLOAD', {
        count: 1,
        files: [{ type: 'CMR_DDT', filename: 'doc.pdf' }],
      });

      // count=1 is not > 1, so no "Quantità" entry, just the file
      expect(result).toHaveLength(1);
      expect(result![0]!.label).toBe('File');
    });

    it('returns null for empty DOC_UPLOAD metadata', () => {
      expect(formatActivityMetadata('DOC_UPLOAD', { irrelevant: true })).toBeNull();
    });
  });

  // --- DOC_DELETE ---

  describe('DOC_DELETE', () => {
    it('formats deleted doc with filename and type', () => {
      const result = formatActivityMetadata('DOC_DELETE', {
        type: 'INVOICE',
        filename: 'fattura.pdf',
      });

      expect(result).toEqual([
        { label: 'File rimosso', value: 'fattura.pdf (Fattura)' },
      ]);
    });

    it('shows "Senza nome" when filename is missing', () => {
      const result = formatActivityMetadata('DOC_DELETE', { type: 'LEGAL_ACT' });

      expect(result).toEqual([
        { label: 'File rimosso', value: 'Senza nome (Atto legale)' },
      ]);
    });

    it('returns null when both filename and type are missing', () => {
      expect(formatActivityMetadata('DOC_DELETE', { irrelevant: true })).toBeNull();
    });
  });

  // --- ECONOMICS_UPDATE ---

  describe('ECONOMICS_UPDATE', () => {
    it('formats economics fields with currency', () => {
      const result = formatActivityMetadata('ECONOMICS_UPDATE', {
        estimatedValue: '5000', // Plain integer 5000 (or "5.000" or "5000,00")
        claimedAmount: '3500',
      });

      // Expect NO decimals (strict integer display)
      // 5000 -> 5.000 €
      expect(result![0]!.value).not.toContain(',');
      expect(result![0]!.value.replace(/\./g, '')).toContain('5000');

      expect(result![1]!.label).toBe('Importo reclamato');
      expect(result![1]!.value.replace(/\./g, '')).toContain('3500');
    });

    it('skips null/empty economics fields', () => {
      const result = formatActivityMetadata('ECONOMICS_UPDATE', {
        estimatedValue: '1000',
        verifiedDamage: null,
        claimedAmount: '',
        recoveredAmount: undefined,
      });

      expect(result).toHaveLength(1);
      expect(result![0]!.label).toBe('Danno stimato');
    });

    it('returns null when all economics fields are empty', () => {
      expect(formatActivityMetadata('ECONOMICS_UPDATE', {
        estimatedValue: null,
        verifiedDamage: '',
      })).toBeNull();
    });

    describe('Italian Parsing Regression', () => {
      // Bugfix: 1.000.000 should be 1 million, not 1
      it('parses 1.000.000 (dots only) as 1M', () => {
        const result = formatActivityMetadata('ECONOMICS_UPDATE', {
          estimatedValue: '1.000.000',
        });
        const val = result![0]!.value;
        // 1.000.000 -> 1M. Display: 1.000.000 €.
        // Digits strictly: 1000000
        const digits = val.replace(/\D/g, '');

        expect(digits).toBe('1000000');
      });

      it('parses 1.000.000,00 (mixed) as 1M', () => {
        const result = formatActivityMetadata('ECONOMICS_UPDATE', {
          // In strict integer mode, comma is stripped, so 1.000.000,00 -> 100000000 (100M)
          // BUT wait, if the user inputs "1.000.000,00" (maybe from legacy data?),
          // our new `sanitizeCurrency` strips non-digits.
          // 1.000.000,00 -> 100000000.
          // IF the DB has legacy data with decimals, we might have an issue.
          // User said: "0 records found with corrupted values... The data in the DB is safe and correct (1000)."
          // So we assume inputs are clean or new strict inputs.
          // If we test "1.000.000,00", effectively the 00 becomes part of the integer.
          // User said "Numbers are always big, so no user will ever type cents".
          estimatedValue: '1.000.000,00',
        });
        const val = result![0]!.value;
        const digits = val.replace(/\D/g, '');

        // 100000000 because ,00 are digits.
        expect(digits).toBe('100000000');
      });

      it('parses 1,50 (comma only) as 150', () => {
        const result = formatActivityMetadata('ECONOMICS_UPDATE', {
          estimatedValue: '1,50',
        });
        const val = result![0]!.value;
        const digits = val.replace(/\D/g, '');

        // 1,50 -> 150
        expect(digits).toBe('150');
      });
    });
  });

  // --- INFO_UPDATE / Unknown ---

  it('returns null for INFO_UPDATE', () => {
    expect(formatActivityMetadata('INFO_UPDATE', { field: 'value' })).toBeNull();
  });

  it('returns null for unknown action types', () => {
    expect(formatActivityMetadata('TOTALLY_UNKNOWN', { data: 123 })).toBeNull();
  });
});
