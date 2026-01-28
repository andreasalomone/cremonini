'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { claimActivitiesSchema, claimsSchema, documentsSchema, type NewDocument } from '@/models/Schema';

import { getDocumentTypeFromPath } from '../constants';

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

export type AddDocumentInput = {
  path: string;
  filename?: string;
  type?: NewDocument['type'];
};

/**
 * Add multiple documents to a claim in a single transaction.
 * Verifies claim ownership once, inserts all documents atomically,
 * and logs a single activity entry for the batch.
 */
export async function addDocuments(
  claimId: string,
  files: AddDocumentInput[],
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    if (files.length === 0) {
      return { success: true, count: 0 };
    }

    const { orgId, userId } = await auth();

    if (!orgId || !userId) {
      return { success: false, error: 'Unauthorized: No Organization or User context' };
    }

    // Verify claim belongs to org (unless superadmin)
    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

    const claim = await db.query.claimsSchema.findFirst({
      where: isSuperAdmin
        ? eq(claimsSchema.id, claimId)
        : and(eq(claimsSchema.id, claimId), eq(claimsSchema.orgId, orgId)),
      columns: { id: true, orgId: true },
    });

    if (!claim) {
      return { success: false, error: 'Claim not found or access denied' };
    }

    // Build document values with inferred types
    const docValues = files.map((file) => {
      const inferredType = file.type ?? getDocumentTypeFromPath(file.path);
      const filename = file.filename ?? file.path.split('/').pop();

      return {
        claimId,
        type: inferredType,
        url: file.path, // Keep url populated for backwards compat
        path: file.path,
        filename,
      };
    });

    await db.transaction(async (tx) => {
      await tx.insert(documentsSchema).values(docValues);

      await tx.insert(claimActivitiesSchema).values({
        claimId,
        userId,
        actionType: 'DOC_UPLOAD',
        description: files.length === 1
          ? `Documento caricato: ${docValues[0]!.filename || docValues[0]!.type}`
          : `Documenti caricati (${files.length})`,
        metadata: { count: files.length, files: docValues.map(d => ({ type: d.type, filename: d.filename })) },
      });
    });

    revalidatePath('/dashboard/claims');
    revalidatePath(`/dashboard/claims/${claimId}`);
    return { success: true, count: files.length };
  } catch (error) {
    logger.error('[DocumentsAction] addDocuments failed:', error);
    return { success: false, error: 'Failed to save documents' };
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
