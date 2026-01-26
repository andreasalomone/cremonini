'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { claimActivitiesSchema, claimsSchema, documentsSchema, type NewDocument } from '@/models/Schema';
import { logger } from '@/libs/Logger';

/**
 * Add a document to a claim.
 * Verifies claim ownership before allowing document upload.
 */
export async function addDocument(
  claimId: string,
  type: NewDocument['type'],
  path: string,
  filename?: string,
) {
  try {
    const { orgId, userId } = await auth();

    if (!orgId || !userId) {
      throw new Error('Unauthorized: No Organization or User context');
    }

    // Verify claim belongs to org (unless superadmin)
    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

    const claim = await db.query.claimsSchema.findFirst({
      where: isSuperAdmin
        ? eq(claimsSchema.id, claimId)
        : and(eq(claimsSchema.id, claimId), eq(claimsSchema.orgId, orgId)),
      columns: { id: true },
    });

    if (!claim) {
      throw new Error('Claim not found or access denied');
    }

    const newDoc = await db.transaction(async (tx) => {
      const [insertedDoc] = await tx.insert(documentsSchema).values({
        claimId,
        type,
        url: path, // Keep url populated for backwards compat
        path,
        filename,
      }).returning();

      await tx.insert(claimActivitiesSchema).values({
        claimId,
        userId,
        actionType: 'DOC_UPLOAD',
        description: `Documento caricato: ${filename || type}`,
        metadata: { type, filename, path },
      });

      return insertedDoc;
    });

    revalidatePath('/dashboard/claims');
    revalidatePath(`/dashboard/claims/${claimId}`);
    return newDoc;
  } catch (error) {
    logger.error('[DocumentsAction] addDocument failed:', error);
    throw error;
  }
}

/**
 * Get all documents for a specific claim.
 * Respects org-level access control.
 */
export async function getDocumentsByClaimId(claimId: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return [];
    }

    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

    // Verify claim ownership first
    const claim = await db.query.claimsSchema.findFirst({
      where: isSuperAdmin
        ? eq(claimsSchema.id, claimId)
        : and(eq(claimsSchema.id, claimId), eq(claimsSchema.orgId, orgId)),
      columns: { id: true },
    });

    if (!claim) {
      return [];
    }

    return await db.query.documentsSchema.findMany({
      where: eq(documentsSchema.claimId, claimId),
      orderBy: documentsSchema.createdAt,
    });
  } catch (error) {
    logger.error('[DocumentsAction] getDocumentsByClaimId failed:', error);
    return [];
  }
}

/**
 * Delete a document.
 * Verifies claim ownership via join before allowing deletion.
 */
export async function deleteDocument(documentId: string) {
  try {
    const { orgId, userId } = await auth();

    if (!orgId || !userId) {
      throw new Error('Unauthorized: No Organization or User context');
    }

    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

    // Get document with claim info for ownership check
    const doc = await db.query.documentsSchema.findFirst({
      where: eq(documentsSchema.id, documentId),
      with: { claim: { columns: { orgId: true } } },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    // Verify ownership
    if (!isSuperAdmin && doc.claim.orgId !== orgId) {
      throw new Error('Access denied');
    }

    await db.transaction(async (tx) => {
      await tx.delete(documentsSchema).where(eq(documentsSchema.id, documentId));

      await tx.insert(claimActivitiesSchema).values({
        claimId: doc.claimId,
        userId,
        actionType: 'DOC_DELETE',
        description: `Documento eliminato: ${doc.filename || doc.type}`,
        metadata: { type: doc.type, filename: doc.filename },
      });
    });

    revalidatePath('/dashboard/claims');
    revalidatePath(`/dashboard/claims/${doc.claimId}`);
    return { success: true };
  } catch (error) {
    logger.error('[DocumentsAction] deleteDocument failed:', error);
    // Return typed error response rather than throwing if client expects it, or rethrow
    throw error;
  }
}

// Document type labels in Italian
export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'CMR_DDT', label: 'CMR / DDT' },
  { value: 'INVOICE', label: 'Fattura' },
  { value: 'PHOTO_REPORT', label: 'Report fotografico' },
  { value: 'EXPERT_REPORT', label: 'Perizia' },
  { value: 'CORRESPONDENCE', label: 'Corrispondenza' },
  { value: 'LEGAL_ACT', label: 'Atto legale' },
] as const;
