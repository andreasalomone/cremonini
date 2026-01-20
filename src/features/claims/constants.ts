export type ClaimStatus = 'OPEN' | 'DOCS_COLLECTION' | 'NEGOTIATION' | 'CLOSED';

export const CLAIM_STATUS_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'DOCS_COLLECTION', label: 'Docs Collection' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'CLOSED', label: 'Closed' },
];
