'use server';

import { auth } from '@clerk/nextjs/server';

import { checkIsSuperAdmin } from '@/libs/auth-utils';
import {
  deleteFile as deleteFromStorage,
  getSignedUrl as getStorageSignedUrl,
  type StorageFolder,
  uploadFile as uploadToStorage,
} from '@/libs/supabase-storage';

/**
 * Upload a file to Supabase Storage
 * Called from client via FormData
 */
export async function uploadFile(formData: FormData, folder: StorageFolder, targetOrgId?: string) {
  const { orgId } = await auth();
  if (!orgId) {
    throw new Error('Non autorizzato');
  }

  // Use targetOrgId if provided (SuperAdmin), otherwise use user's orgId
  const finalOrgId = targetOrgId || orgId;

  const path = await uploadToStorage(formData, folder, finalOrgId);
  return { path };
}

/**
 * Get a signed URL for a document
 * Only allows access to files within the user's organization
 */
export async function getDocumentUrl(path: string) {
  const { orgId } = await auth();
  const isSuperAdmin = checkIsSuperAdmin(orgId);

  if (!orgId && !isSuperAdmin) {
    throw new Error('Non autorizzato');
  }

  // Security: verify path belongs to org unless SuperAdmin
  if (!isSuperAdmin && !path.startsWith(orgId || '')) {
    throw new Error('Accesso negato');
  }

  const url = await getStorageSignedUrl(path);
  return { url };
}

/**
 * Delete a document from storage
 * Only allows deletion of files within the user's organization
 */
export async function deleteDocument(path: string) {
  const { orgId } = await auth();
  if (!orgId) {
    throw new Error('Non autorizzato');
  }

  // Security: verify path belongs to org
  if (!path.startsWith(orgId)) {
    throw new Error('Accesso negato');
  }

  await deleteFromStorage(path);
  return { success: true };
}
