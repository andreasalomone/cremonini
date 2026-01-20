'use server';

import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { calculateDeadlines } from '@/libs/deadline-logic';
import { Env } from '@/libs/Env';
import { claimsSchema } from '@/models/Schema';

import type { ClaimStatus } from '../constants';

// Types
export type CreateClaimInput = {
  type: 'TRANSPORT' | 'STOCK' | 'DEPOSIT';
  eventDate: Date;
  carrierName?: string;
  estimatedValue?: string;
  description?: string;
  documentUrl?: string;
};

/**
 * "God Mode" Data Access
 * S&A Admin sees ALL (limited to 100 for scalability).
 * Company Rep sees ONLY their org.
 */
export async function getClaims() {
  const { orgId } = await auth();

  if (!orgId) {
    return [];
  }

  // --- GOD MODE LOGIC ---
  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  if (isSuperAdmin) {
    // Audit finding: Add limit for admin view scalability
    return await db
      .select()
      .from(claimsSchema)
      .orderBy(desc(claimsSchema.createdAt))
      .limit(100);
  }

  return await db
    .select()
    .from(claimsSchema)
    .where(eq(claimsSchema.orgId, orgId))
    .orderBy(desc(claimsSchema.createdAt));
}

export async function createClaim(data: CreateClaimInput) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    throw new Error('Unauthorized: No Organization or User context');
  }

  // --- AUTOMATED DEADLINE LOGIC ---
  const eventDate = new Date(data.eventDate);
  const { reserveDeadline, prescriptionDeadline } = calculateDeadlines(eventDate, data.type);

  // Helper to format Date to YYYY-MM-DD for PG date columns
  const formatDate = (d: Date): string => d.toISOString().split('T')[0]!;
  const formatDateNullable = (d: Date | null): string | null =>
    d ? formatDate(d) : null;

  const newClaim: typeof claimsSchema.$inferInsert = {
    orgId,
    creatorId: userId,
    status: 'OPEN',
    type: data.type,
    eventDate: formatDate(eventDate),
    carrierName: data.carrierName,
    estimatedValue: data.estimatedValue,
    description: data.description,
    documentUrl: data.documentUrl,
    reserveDeadline: formatDateNullable(reserveDeadline),
    prescriptionDeadline: formatDateNullable(prescriptionDeadline),
  };

  await db.insert(claimsSchema).values(newClaim);

  revalidatePath('/dashboard/claims');
  return { success: true };
}

export async function updateClaimStatus(claimId: string, newStatus: ClaimStatus) {
  const { orgId, userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  if (!isSuperAdmin && !orgId) {
    return { success: false, error: 'Unauthorized: No Organization context' };
  }

  if (!isSuperAdmin) {
    const existingClaim = await db.query.claimsSchema.findFirst({
      where: and(eq(claimsSchema.id, claimId), eq(claimsSchema.orgId, orgId!)),
    });

    if (!existingClaim) {
      return { success: false, error: 'Claim not found or access denied' };
    }
  }

  // Prepare update data
  const dataToUpdate: Partial<typeof claimsSchema.$inferInsert> = {
    status: newStatus,
    updatedAt: new Date(),
  };

  // --- AUDIT TRAIL: CAPTURE CLOSED_AT ---
  if (newStatus === 'CLOSED') {
    dataToUpdate.closedAt = new Date();
  } else {
    dataToUpdate.closedAt = null; // Reset if reopened
  }

  try {
    await db
      .update(claimsSchema)
      .set(dataToUpdate)
      .where(eq(claimsSchema.id, claimId));

    revalidatePath('/dashboard/claims');
    return { success: true };
  } catch (error) {
    console.error(`[ClaimsAction] Failed to update claim ${claimId} status:`, error);
    return { success: false, error: 'Database update failed' };
  }
}
