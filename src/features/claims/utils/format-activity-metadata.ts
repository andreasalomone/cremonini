import { CLAIM_STATUS_OPTIONS } from '@/features/claims/constants';
import { DOCUMENT_TYPE_OPTIONS } from '@/features/documents/constants';
import { sanitizeCurrency } from '@/utils/Currency';

// --- Types ---

export type MetadataEntry = {
  label: string;
  value: string;
};

type ActivityType =
  | 'CREATED'
  | 'STATUS_CHANGE'
  | 'DOC_UPLOAD'
  | 'DOC_DELETE'
  | 'INFO_UPDATE'
  | 'ECONOMICS_UPDATE';

// --- Label Resolvers ---

const ECONOMIC_FIELD_LABELS: Record<string, string> = {
  estimatedValue: 'Danno stimato',
  verifiedDamage: 'Danno accertato',
  claimedAmount: 'Importo reclamato',
  recoveredAmount: 'Importo recuperato',
  estimatedRecovery: 'Recupero stimato',
};

function resolveStatusLabel(status: string): string {
  const match = CLAIM_STATUS_OPTIONS.find(opt => opt.value === status);
  return match?.label ?? status;
}

function resolveDocTypeLabel(type: string): string {
  return (
    DOCUMENT_TYPE_OPTIONS.find(opt => opt.value === type)?.label ?? type
  );
}

function formatCurrency(value: string | number): string {
  let num: number;

  if (typeof value === 'string') {
    const sanitized = sanitizeCurrency(value);

    if (!sanitized) {
      num = Number.parseFloat(value);
    } else {
      num = Number.parseFloat(sanitized);
    }
  } else {
    num = value;
  }

  if (Number.isNaN(num)) {
    return String(value);
  }

  return num.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

// --- Per-Type Formatters ---

function formatStatusChange(meta: Record<string, unknown>): MetadataEntry[] | null {
  const { oldStatus, newStatus } = meta;
  if (typeof oldStatus !== 'string' || typeof newStatus !== 'string') {
    return null;
  }

  return [
    {
      label: 'Transizione',
      value: `${resolveStatusLabel(oldStatus)} → ${resolveStatusLabel(newStatus)}`,
    },
  ];
}

function formatDocUpload(meta: Record<string, unknown>): MetadataEntry[] | null {
  const entries: MetadataEntry[] = [];

  // Single doc upload: { type, filename, path }
  if (typeof meta.filename === 'string') {
    const typeLabel = typeof meta.type === 'string' ? resolveDocTypeLabel(meta.type) : null;
    entries.push({
      label: 'File',
      value: typeLabel ? `${meta.filename} (${typeLabel})` : meta.filename,
    });
  }

  // Batch upload: { count, files?: [{ type, filename }] }
  if (typeof meta.count === 'number' && meta.count > 1) {
    entries.push({ label: 'Quantità', value: `${meta.count} documenti` });
  }

  if (Array.isArray(meta.files)) {
    for (const file of meta.files) {
      if (typeof file === 'object' && file !== null && 'filename' in file) {
        const f = file as { filename?: string; type?: string };
        const typeLabel = f.type ? resolveDocTypeLabel(f.type) : null;
        const name = f.filename ?? 'Senza nome';
        entries.push({
          label: 'File',
          value: typeLabel ? `${name} (${typeLabel})` : name,
        });
      }
    }
  }

  return entries.length > 0 ? entries : null;
}

function formatDocDelete(meta: Record<string, unknown>): MetadataEntry[] | null {
  if (typeof meta.filename !== 'string' && typeof meta.type !== 'string') {
    return null;
  }

  const filename = typeof meta.filename === 'string' ? meta.filename : 'Senza nome';
  const typeLabel = typeof meta.type === 'string' ? resolveDocTypeLabel(meta.type) : null;

  return [
    {
      label: 'File rimosso',
      value: typeLabel ? `${filename} (${typeLabel})` : filename,
    },
  ];
}

function formatEconomicsUpdate(meta: Record<string, unknown>): MetadataEntry[] | null {
  const entries: MetadataEntry[] = [];

  for (const [key, label] of Object.entries(ECONOMIC_FIELD_LABELS)) {
    const raw = meta[key];
    if (raw != null && raw !== '' && raw !== undefined) {
      entries.push({
        label,
        value: formatCurrency(raw as string | number),
      });
    }
  }

  return entries.length > 0 ? entries : null;
}

// --- Public API ---

/**
 * Converts raw JSONB metadata into human-readable key-value entries.
 * Returns `null` when metadata should be hidden (empty, unknown type, etc.).
 */
export function formatActivityMetadata(
  actionType: string,
  metadata: unknown,
): MetadataEntry[] | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const meta = metadata as Record<string, unknown>;
  if (Object.keys(meta).length === 0) {
    return null;
  }

  switch (actionType as ActivityType) {
    case 'STATUS_CHANGE':
      return formatStatusChange(meta);
    case 'DOC_UPLOAD':
      return formatDocUpload(meta);
    case 'DOC_DELETE':
      return formatDocDelete(meta);
    case 'ECONOMICS_UPDATE':
      return formatEconomicsUpdate(meta);
    // CREATED / INFO_UPDATE / unknown → hide metadata
    default:
      return null;
  }
}
