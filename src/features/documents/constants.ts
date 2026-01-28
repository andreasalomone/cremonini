import type { NewDocument } from '@/models/Schema';

// Document type labels in Italian
export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'CMR_DDT', label: 'CMR / DDT' },
  { value: 'INVOICE', label: 'Fattura' },
  { value: 'PHOTO_REPORT', label: 'Report fotografico' },
  { value: 'EXPERT_REPORT', label: 'Perizia' },
  { value: 'CORRESPONDENCE', label: 'Corrispondenza' },
  { value: 'LEGAL_ACT', label: 'Atto legale' },
] as const;

/**
 * Infer document type from file path extension.
 * - Images (.jpg, .jpeg, .png, .webp, .gif) -> PHOTO_REPORT
 * - Emails (.eml, .msg) -> CORRESPONDENCE
 * - Everything else -> CMR_DDT (default for transport docs)
 */
export function getDocumentTypeFromPath(path: string): NewDocument['type'] {
  const ext = path.split('.').pop()?.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) {
    return 'PHOTO_REPORT';
  }

  if (['eml', 'msg'].includes(ext || '')) {
    return 'CORRESPONDENCE';
  }

  return 'CMR_DDT';
}
