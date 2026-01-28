import { CLAIM_STATE_OPTIONS, CLAIM_TYPE_OPTIONS } from '@/features/claims/constants';
import type { Claim, ClaimActivity, Document as ClaimDocument } from '@/models/Schema';
import type { Serialized } from '@/utils/serialization';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export type ClaimViewModel = {
  id: string;
  orgId: string;
  shortId: string;
  status: string;
  typeLabel: string;
  stateLabel: string;
  formattedCreatedAt: string;
  formattedEventDate: string;
  location: string;
  documentNumber: string;
  carrierName: string;
  thirdPartyName: string | null;
  description: string;
  documents: Serialized<ClaimDocument>[];
  activities: Serialized<ClaimActivity>[];
  economics: {
    estimatedValue: string;
    verifiedDamage: string;
    claimedAmount: string;
    recoveredAmount: string;
    estimatedRecovery: string;
  };
};

// ----------------------------------------------------------------------
// Formatters
// ----------------------------------------------------------------------

const LOCALE_IT = 'it-IT';

const dateFormatter = new Intl.DateTimeFormat(LOCALE_IT, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const formatDate = (date: Date | string | number | null | undefined): string => {
  if (!date) {
    return '-';
  }
  try {
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? '-' : dateFormatter.format(d);
  } catch {
    return '-';
  }
};

export const formatCurrencyString = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined) {
    return '';
  }
  return String(val);
};

// ----------------------------------------------------------------------
// Mapper
// ----------------------------------------------------------------------

/**
 * Transforms the raw API response (after serialization) into a safe View Model.
 * Acts as an Anti-Corruption Layer (ACL).
 */
export const toClaimViewModel = (claim: Serialized<Claim>): ClaimViewModel => {
  const typeOption = CLAIM_TYPE_OPTIONS.find(opt => opt.value === claim.type);
  const typeLabel = typeOption ? typeOption.label : claim.type;

  const stateOption = CLAIM_STATE_OPTIONS.find(opt => opt.value === claim.state);
  const stateLabel = stateOption ? stateOption.label : claim.state;

  return {
    id: claim.id,
    orgId: claim.orgId,
    shortId: claim.id.slice(0, 8),
    status: claim.status,
    typeLabel,
    stateLabel,
    formattedCreatedAt: formatDate(claim.createdAt),
    formattedEventDate: formatDate(claim.eventDate),
    location: claim.location || '-',
    documentNumber: claim.documentNumber || '-',
    carrierName: claim.carrierName || '-',
    thirdPartyName: claim.hasThirdPartyResponsible ? (claim.thirdPartyName || '-') : null,
    description: claim.description || 'Nessuna descrizione fornita.',
    documents: (claim.documents as Serialized<ClaimDocument>[]) ?? [],
    activities: (claim.activities as Serialized<ClaimActivity>[]) ?? [],
    economics: {
      estimatedValue: formatCurrencyString(claim.estimatedValue),
      verifiedDamage: formatCurrencyString(claim.verifiedDamage),
      claimedAmount: formatCurrencyString(claim.claimedAmount),
      recoveredAmount: formatCurrencyString(claim.recoveredAmount),
      estimatedRecovery: formatCurrencyString(claim.estimatedRecovery),
    },
  };
};
