import { describe, expect, it, vi } from 'vitest';

import { CLAIM_STATE_OPTIONS, CLAIM_TYPE_OPTIONS } from '@/features/claims/constants';
import type { Claim } from '@/models/Schema';
import type { Serialized } from '@/utils/serialization';

import { formatCurrencyString, formatDate, toClaimViewModel } from './claim-view-model';

describe('formatDate', () => {
  it('formats a valid Date object in it-IT locale (dd/mm/yyyy)', () => {
    const date = new Date('2023-01-15T00:00:00.000Z');
    const result = formatDate(date);

    expect(result).toMatch(/15\/01\/2023/);
  });

  it('formats a valid ISO string', () => {
    const result = formatDate('2023-01-15T00:00:00.000Z');

    expect(result).toMatch(/15\/01\/2023/);
  });

  it('formats a timestamp number', () => {
    const timestamp = new Date('2023-01-15T00:00:00.000Z').getTime();
    const result = formatDate(timestamp);

    expect(result).toMatch(/15\/01\/2023/);
  });

  it('returns "-" for null', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('returns "-" for undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('returns "-" for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('-');
  });

  it('returns "-" for empty string', () => {
    expect(formatDate('')).toBe('-');
  });

  it('handles edge dates correctly', () => {
    // Year boundary
    expect(formatDate('2023-12-31')).toMatch(/31\/12\/2023/);
    // Leap year
    expect(formatDate('2024-02-29')).toMatch(/29\/02\/2024/);
  });
});

describe('formatCurrencyString', () => {
  it('returns empty string for null', () => {
    expect(formatCurrencyString(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatCurrencyString(undefined)).toBe('');
  });

  it('converts number to string', () => {
    expect(formatCurrencyString(1234.56)).toBe('1234.56');
  });

  it('preserves string values', () => {
    expect(formatCurrencyString('1234.56')).toBe('1234.56');
  });

  it('handles zero', () => {
    expect(formatCurrencyString(0)).toBe('0');
    expect(formatCurrencyString('0')).toBe('0');
  });

  it('handles negative numbers', () => {
    expect(formatCurrencyString(-100.50)).toBe('-100.5');
  });
});

describe('toClaimViewModel', () => {
  const baseClaim: Serialized<Claim> = {
    id: 'claim-123-long-id',
    orgId: 'org-1',
    creatorId: 'user-1',
    status: 'OPEN',
    type: 'TERRESTRIAL',
    state: 'NATIONAL',
    eventDate: '2023-01-15T00:00:00.000Z',
    location: 'Milano',
    documentNumber: 'DDT-001',
    carrierName: 'Carrier SPA',
    hasThirdPartyResponsible: true,
    thirdPartyName: 'Bad Guy SRL',
    estimatedRecovery: '1000.50',
    description: 'Test description',
    documentUrl: null,
    documentPath: null,
    stockInboundDate: null,
    stockOutboundDate: null,
    hasStockInboundReserve: false,
    hasGrossNegligence: false,
    estimatedValue: '5000.00',
    verifiedDamage: '4500.00',
    claimedAmount: '4500.00',
    recoveredAmount: '0.00',
    reserveDeadline: null,
    prescriptionDeadline: null,
    claimFollowUpDeadline: null,
    negotiationDeadline: null,
    legalActionDeadline: null,
    closedAt: null,
    reserveNotificationSent: false,
    prescriptionNotificationSent: false,
    updatedAt: '2023-01-20T10:00:00.000Z',
    createdAt: '2023-01-10T10:00:00.000Z',
    documents: [],
    activities: [],
  };

  describe('basic field transformations', () => {
    it('transforms basic fields correctly', () => {
      const vm = toClaimViewModel(baseClaim);

      expect(vm.id).toBe('claim-123-long-id');
      expect(vm.shortId).toBe('claim-12');
      expect(vm.status).toBe('OPEN');
      expect(vm.location).toBe('Milano');
      expect(vm.description).toBe('Test description');
      expect(vm.orgId).toBe('org-1');
    });

    it('generates correct shortId (first 8 characters)', () => {
      const shortIdClaim = { ...baseClaim, id: 'abcdefghijklmnop' };
      const vm = toClaimViewModel(shortIdClaim);

      expect(vm.shortId).toBe('abcdefgh');
    });

    it('handles very short IDs gracefully', () => {
      const shortIdClaim = { ...baseClaim, id: 'abc' };
      const vm = toClaimViewModel(shortIdClaim);

      expect(vm.shortId).toBe('abc'); // slice(0,8) on 3-char string
    });
  });

  describe('date formatting', () => {
    it('formats dates correctly (it-IT)', () => {
      const vm = toClaimViewModel(baseClaim);

      expect(vm.formattedCreatedAt).toMatch(/10\/01\/2023/);
      expect(vm.formattedEventDate).toMatch(/15\/01\/2023/);
    });

    it('handles missing dates with fallback', () => {
      const noDateClaim = {
        ...baseClaim,
        createdAt: null as any,
        eventDate: null as any,
      };
      const vm = toClaimViewModel(noDateClaim);

      expect(vm.formattedCreatedAt).toBe('-');
      expect(vm.formattedEventDate).toBe('-');
    });
  });

  describe('label lookups for enumerations', () => {
    it('resolves type label from constants', () => {
      const vm = toClaimViewModel(baseClaim);
      const expectedLabel = CLAIM_TYPE_OPTIONS.find(opt => opt.value === 'TERRESTRIAL')?.label;

      expect(vm.typeLabel).toBe(expectedLabel);
    });

    it('resolves state label from constants', () => {
      const vm = toClaimViewModel(baseClaim);
      const expectedLabel = CLAIM_STATE_OPTIONS.find(opt => opt.value === 'NATIONAL')?.label;

      expect(vm.stateLabel).toBe(expectedLabel);
    });

    it('falls back to raw value for unknown type', () => {
      const unknownTypeClaim = { ...baseClaim, type: 'UNKNOWN_TYPE' as any };
      const vm = toClaimViewModel(unknownTypeClaim);

      expect(vm.typeLabel).toBe('UNKNOWN_TYPE');
    });

    it('falls back to raw value for unknown state', () => {
      const unknownStateClaim = { ...baseClaim, state: 'UNKNOWN_STATE' as any };
      const vm = toClaimViewModel(unknownStateClaim);

      expect(vm.stateLabel).toBe('UNKNOWN_STATE');
    });

    it('handles all defined claim types', () => {
      CLAIM_TYPE_OPTIONS.forEach((option) => {
        const claim = { ...baseClaim, type: option.value };
        const vm = toClaimViewModel(claim);

        expect(vm.typeLabel).toBe(option.label);
      });
    });

    it('handles all defined claim states', () => {
      CLAIM_STATE_OPTIONS.forEach((option) => {
        const claim = { ...baseClaim, state: option.value };
        const vm = toClaimViewModel(claim);

        expect(vm.stateLabel).toBe(option.label);
      });
    });
  });

  describe('null/undefined field fallbacks', () => {
    it('handles null/undefined fields with fallbacks', () => {
      const sparseClaim = {
        ...baseClaim,
        location: null,
        documentNumber: null,
        carrierName: null,
        hasThirdPartyResponsible: false,
        thirdPartyName: null,
        description: null,
        estimatedValue: null,
      };

      const vm = toClaimViewModel(sparseClaim);

      expect(vm.location).toBe('-');
      expect(vm.documentNumber).toBe('-');
      expect(vm.carrierName).toBe('-');
      expect(vm.thirdPartyName).toBeNull();
      expect(vm.description).toBe('Nessuna descrizione fornita.');
      expect(vm.economics.estimatedValue).toBe('');
    });

    it('handles empty strings as truthy (no fallback)', () => {
      const emptyStringClaim = {
        ...baseClaim,
        location: '',
        description: '',
      };

      const vm = toClaimViewModel(emptyStringClaim);

      // Empty string is falsy, so should use fallback
      expect(vm.location).toBe('-');
      expect(vm.description).toBe('Nessuna descrizione fornita.');
    });
  });

  describe('third party name logic', () => {
    it('shows third party name when hasThirdPartyResponsible is true', () => {
      const withThirdParty = { ...baseClaim, hasThirdPartyResponsible: true, thirdPartyName: 'Foo' };

      expect(toClaimViewModel(withThirdParty).thirdPartyName).toBe('Foo');
    });

    it('shows "-" when hasThirdPartyResponsible is true but name is missing', () => {
      const missingName = { ...baseClaim, hasThirdPartyResponsible: true, thirdPartyName: null };

      expect(toClaimViewModel(missingName).thirdPartyName).toBe('-');
    });

    it('returns null when hasThirdPartyResponsible is false (ignores populated name)', () => {
      const ignoredName = { ...baseClaim, hasThirdPartyResponsible: false, thirdPartyName: 'Ignored' };

      expect(toClaimViewModel(ignoredName).thirdPartyName).toBeNull();
    });

    it('returns null when hasThirdPartyResponsible is false and name is null', () => {
      const noThirdParty = { ...baseClaim, hasThirdPartyResponsible: false, thirdPartyName: null };

      expect(toClaimViewModel(noThirdParty).thirdPartyName).toBeNull();
    });
  });

  describe('economics formatting', () => {
    it('formats economics as strings', () => {
      const vm = toClaimViewModel(baseClaim);

      expect(vm.economics.estimatedValue).toBe('5000.00');
      expect(vm.economics.verifiedDamage).toBe('4500.00');
      expect(vm.economics.claimedAmount).toBe('4500.00');
      expect(vm.economics.recoveredAmount).toBe('0.00');
      expect(vm.economics.estimatedRecovery).toBe('1000.50');
    });

    it('handles null economics gracefully', () => {
      const nullEconomics = {
        ...baseClaim,
        estimatedValue: null,
        verifiedDamage: null,
        claimedAmount: null,
        recoveredAmount: null,
        estimatedRecovery: null,
      };

      const vm = toClaimViewModel(nullEconomics);

      expect(vm.economics.estimatedValue).toBe('');
      expect(vm.economics.verifiedDamage).toBe('');
      expect(vm.economics.claimedAmount).toBe('');
      expect(vm.economics.recoveredAmount).toBe('');
      expect(vm.economics.estimatedRecovery).toBe('');
    });
  });

  describe('documents and activities arrays', () => {
    it('passes through valid document arrays', () => {
      const claimWithDocs = {
        ...baseClaim,
        documents: [
          { id: 'doc-1', type: 'CMR_DDT', path: '/path', claimId: baseClaim.id },
        ],
      };

      const vm = toClaimViewModel(claimWithDocs as any);

      expect(vm.documents).toHaveLength(1);
      expect(vm.documents[0]!.id).toBe('doc-1');
    });

    it('passes through valid activity arrays', () => {
      const claimWithActivities = {
        ...baseClaim,
        activities: [
          { id: 'act-1', actionType: 'CREATED', claimId: baseClaim.id },
        ],
      };

      const vm = toClaimViewModel(claimWithActivities as any);

      expect(vm.activities).toHaveLength(1);
      expect(vm.activities[0]!.id).toBe('act-1');
    });

    it('returns empty array when documents is null', () => {
      const nullDocs = { ...baseClaim, documents: null as any };

      const vm = toClaimViewModel(nullDocs);

      expect(vm.documents).toEqual([]);
    });

    it('returns empty array when activities is undefined', () => {
      const undefinedActivities = { ...baseClaim, activities: undefined as any };

      const vm = toClaimViewModel(undefinedActivities);

      expect(vm.activities).toEqual([]);
    });

    it('handles non-array documents gracefully and logs warning', () => {
      // In case of data corruption or API issues
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const badDocs = { ...baseClaim, documents: 'not-an-array' as any };

      const vm = toClaimViewModel(badDocs);

      expect(vm.documents).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Field "documents"'),
        expect.anything(),
      );

      warnSpy.mockRestore();
    });
  });
});
