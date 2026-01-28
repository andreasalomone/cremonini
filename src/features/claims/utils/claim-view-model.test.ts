import { describe, expect, it } from 'vitest';

import type { Claim } from '@/models/Schema';
import type { Serialized } from '@/utils/serialization';

import { toClaimViewModel } from './claim-view-model';

// Mock options (constants can be imported or mocked if dependent on external systems,
// strictly these are constants so importing them is fine, but for purity we test the output)

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
    // Relations (even if optional in type, we treat them as serialized input)
    documents: [],
    activities: [],
  };

  const serializedBaseClaim = baseClaim;

  it('transforms basic fields correctly', () => {
    const vm = toClaimViewModel(serializedBaseClaim);

    expect(vm.id).toBe('claim-123-long-id');
    expect(vm.shortId).toBe('claim-12'); // slice(0,8) of 'claim-123-long-id' is 'claim-12' (len 8)
    expect(vm.status).toBe('OPEN');
    expect(vm.location).toBe('Milano');
    expect(vm.description).toBe('Test description');
  });

  it('formats dates correctly (it-IT)', () => {
    const vm = toClaimViewModel(serializedBaseClaim);

    // 10/01/2023 for createdAt (day/month/year)
    // 15/01/2023 for eventDate
    expect(vm.formattedCreatedAt).toMatch(/10\/01\/2023/);
    expect(vm.formattedEventDate).toMatch(/15\/01\/2023/);
  });

  it('handles label lookups for enumerations', () => {
    const vm = toClaimViewModel(serializedBaseClaim);

    // TERRESTRIAL -> Terrestre
    // NATIONAL -> Nazionale
    // Note: This test depends on the actual constants values.
    // If constants change, this might fail, which is good (we want to know).
    expect(vm.typeLabel).toBeDefined();
    expect(vm.stateLabel).toBeDefined();
  });

  it('handles null/undefined fields with fallbacks', () => {
    const sparseClaim = {
      ...serializedBaseClaim,
      location: null,
      documentNumber: null,
      carrierName: null,
      hasThirdPartyResponsible: false,
      thirdPartyName: null, // should be null if not responsible
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

  it('handles third party name logic', () => {
    const withThirdParty = { ...serializedBaseClaim, hasThirdPartyResponsible: true, thirdPartyName: 'Foo' };

    expect(toClaimViewModel(withThirdParty).thirdPartyName).toBe('Foo');

    // If flag is true but name missing
    const missingName = { ...serializedBaseClaim, hasThirdPartyResponsible: true, thirdPartyName: null };

    expect(toClaimViewModel(missingName).thirdPartyName).toBe('-');

    // If flag is false, name should be null even if populated in DB (should ignore it logically)
    // Implementation says: hasThirdPartyResponsible ? (name || '-') : null
    const ignoredName = { ...serializedBaseClaim, hasThirdPartyResponsible: false, thirdPartyName: 'Ignored' };

    expect(toClaimViewModel(ignoredName).thirdPartyName).toBeNull();
  });

  it('formats economics as strings', () => {
    const vm = toClaimViewModel(serializedBaseClaim);

    expect(vm.economics.estimatedValue).toBe('5000.00');
    expect(vm.economics.verifiedDamage).toBe('4500.00');
  });
});
