export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'application/pdf',
  'message/rfc822',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.eml',
  '.xls',
  '.xlsx',
  '.doc',
  '.docx',
  '.txt',
  '.avif',
  '.heic',
  '.heif',
] as const;

// 50MB (free tier limit)
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const validateFile = (file: { type: string; name: string; size: number }) => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File supera il limite di 50MB' };
  }

  const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type as any);
  const isExtValid = ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));

  if (!isMimeValid && !isExtValid) {
    return { valid: false, error: 'Tipo file non supportato. Formati ammessi: Immagini, PDF, Office (Excel/Word), Testo, EML.' };
  }
  return { valid: true };
};
