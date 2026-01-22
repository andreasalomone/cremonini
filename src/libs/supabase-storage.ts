import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';

const BUCKET = Env.NEXT_PUBLIC_STORAGE_BUCKET_NAME;

// Lazy-initialized Supabase client singleton
// This prevents "supabaseUrl is required" errors during build
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      Env.NEXT_PUBLIC_SUPABASE_URL,
      Env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }
  return supabaseClient;
}

export type StorageFolder = 'claims' | 'documents' | 'procura';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (free tier limit)

/**
 * Upload a file to Supabase Storage via FormData (server action compatible)
 */
export async function uploadFile(
  formData: FormData,
  folder: StorageFolder,
  orgId: string,
): Promise<string> {
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('Nessun file fornito');
  }

  // Validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Tipo file non valido (solo immagini o PDF)');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File supera il limite di 50MB');
  }

  const ext = file.name.split('.').pop();
  const path = `${orgId}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await getSupabaseClient().storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
  });

  if (error) {
    logger.error('[Storage] Upload failed', { path, error: error.message });
    throw new Error('Upload fallito');
  }

  logger.info('[Storage] Upload complete', { path, folder, orgId });
  return path;
}

/**
 * Generate a time-limited signed URL for private file access
 */
export async function getSignedUrl(
  path: string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .storage.from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    logger.error('[Storage] Signed URL failed', { path, error: error.message });
    throw error;
  }
  return data.signedUrl;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await getSupabaseClient().storage.from(BUCKET).remove([path]);
  if (error) {
    logger.error('[Storage] Delete failed', { path, error: error.message });
    throw error;
  }
  logger.info('[Storage] File deleted', { path });
}
