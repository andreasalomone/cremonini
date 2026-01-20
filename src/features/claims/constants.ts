// 11 workflow states matching Schema.ts claimStatusEnum
export type ClaimStatus =
  | 'OPEN'
  | 'DOCS_COLLECTION'
  | 'RESERVE_SENT'
  | 'DAMAGE_EVALUATION'
  | 'CLAIM_SENT'
  | 'NEGOTIATION_EXTRAJUDICIAL'
  | 'NEGOTIATION_ASSISTED'
  | 'LEGAL_ACTION'
  | 'PARTIAL_RECOVERY'
  | 'FULL_RECOVERY'
  | 'CLOSED';

export const CLAIM_STATUS_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: 'OPEN', label: 'Aperto' },
  { value: 'DOCS_COLLECTION', label: 'Documentazione in raccolta' },
  { value: 'RESERVE_SENT', label: 'Riserva inviata' },
  { value: 'DAMAGE_EVALUATION', label: 'Danno in valutazione' },
  { value: 'CLAIM_SENT', label: 'Reclamo inviato' },
  { value: 'NEGOTIATION_EXTRAJUDICIAL', label: 'Negoziazione stragiudiziale' },
  { value: 'NEGOTIATION_ASSISTED', label: 'Negoziazione assistita' },
  { value: 'LEGAL_ACTION', label: 'Azione giudiziale' },
  { value: 'PARTIAL_RECOVERY', label: 'Recupero parziale' },
  { value: 'FULL_RECOVERY', label: 'Recupero totale' },
  { value: 'CLOSED', label: 'Chiuso' },
];
