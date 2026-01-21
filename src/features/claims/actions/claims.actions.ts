'use server';

import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { calculateDeadlines, calculateExtendedDeadline } from '@/libs/deadline-logic';
import { Env } from '@/libs/Env';
import { claimsSchema } from '@/models/Schema';

import type { ClaimStatus } from '../constants';

// Types
export type CreateClaimInput = {
  type: 'TRANSPORT' | 'STOCK' | 'DEPOSIT';
  eventDate: Date;
  location: string;
  ddtCmrNumber?: string;
  hasThirdPartyResponsible?: boolean;
  carrierName?: string;
  estimatedValue?: string;
  description?: string;
  documentPath?: string;
};

// Helpers
const formatDate = (d: Date): string => d.toISOString().split('T')[0]!;
const formatDateNullable = (d: Date | null): string | null =>
  d ? formatDate(d) : null;

/**
 * Sanitizes Italian currency strings (e.g. "1.234,56") into
 * standard decimal strings (e.g. "1234.56") for the DB.
 */
const sanitizeCurrency = (val?: string): string | null => {
  if (!val) {
    return null;
  }
  // Remove thousands separator (.) and replace decimal separator (,) with (.)
  return val.replace(/\./g, '').replace(',', '.');
};

/**
 * "God Mode" Data Access
 * S&A Admin sees ALL (limited to 100 for scalability).
 * Company Rep sees ONLY their org.
 * ✅ AUDIT FIX: Uses query API with relations for N+1 prevention
 */
export async function getClaims() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      console.warn('[ClaimsAction] No orgId found in auth context');
      return [];
    }

    // --- GOD MODE LOGIC ---
    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;
    console.log(`[ClaimsAction] Fetching claims for orgId: ${orgId} (isSuperAdmin: ${isSuperAdmin})`);

    // ✅ AUDIT FIX: Use query API with relations instead of select()
    const results = await db.query.claimsSchema.findMany({
      where: isSuperAdmin ? undefined : eq(claimsSchema.orgId, orgId),
      with: { documents: true },
      orderBy: desc(claimsSchema.createdAt),
      limit: isSuperAdmin ? 100 : undefined,
    });

    console.log(`[ClaimsAction] Successfully fetched ${results.length} claims`);
    return results;
  } catch (error) {
    console.error('[ClaimsAction] getClaims failed:', error);
    return [];
  }
}

export async function createClaim(data: CreateClaimInput) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    throw new Error('Unauthorized: No Organization or User context');
  }

  // --- AUTOMATED DEADLINE LOGIC ---
  const eventDate = new Date(data.eventDate);
  const { reserveDeadline, prescriptionDeadline } = calculateDeadlines(eventDate, data.type);

  const newClaim: typeof claimsSchema.$inferInsert = {
    orgId,
    creatorId: userId,
    status: 'OPEN',
    type: data.type,
    eventDate: formatDate(eventDate),
    location: data.location,
    ddtCmrNumber: data.ddtCmrNumber,
    hasThirdPartyResponsible: data.hasThirdPartyResponsible ?? false,
    carrierName: data.carrierName,
    estimatedValue: sanitizeCurrency(data.estimatedValue),
    description: data.description,
    documentPath: data.documentPath,
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
    // ✅ AUDIT FIX: Partial select - only fetch id
    const existingClaim = await db.query.claimsSchema.findFirst({
      where: and(eq(claimsSchema.id, claimId), eq(claimsSchema.orgId, orgId!)),
      columns: { id: true },
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

  // --- AUTOMATED DEADLINE RECALCULATION ---
  // When entering specific phases, we extend deadlines based on today's date
  if (newStatus === 'CLAIM_SENT') {
    dataToUpdate.claimFollowUpDeadline = formatDate(
      calculateExtendedDeadline(new Date(), 'CLAIM_SENT'),
    );
  } else if (
    newStatus === 'NEGOTIATION_EXTRAJUDICIAL'
    || newStatus === 'NEGOTIATION_ASSISTED'
  ) {
    dataToUpdate.negotiationDeadline = formatDate(
      calculateExtendedDeadline(new Date(), 'NEGOTIATION'),
    );
  }

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

// Economic data update type
export type UpdateClaimEconomicsInput = {
  estimatedValue?: string;
  verifiedDamage?: string;
  claimedAmount?: string;
  recoveredAmount?: string;
};

/**
 * Update economic fields for a claim.
 * Respects org-level access control.
 */
export async function updateClaimEconomics(claimId: string, data: UpdateClaimEconomicsInput) {
  const { orgId, userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  if (!isSuperAdmin && !orgId) {
    return { success: false, error: 'Unauthorized: No Organization context' };
  }

  // Verify ownership for non-admin
  if (!isSuperAdmin) {
    const existingClaim = await db.query.claimsSchema.findFirst({
      where: and(eq(claimsSchema.id, claimId), eq(claimsSchema.orgId, orgId!)),
      columns: { id: true },
    });

    if (!existingClaim) {
      return { success: false, error: 'Claim not found or access denied' };
    }
  }

  try {
    await db
      .update(claimsSchema)
      .set({
        estimatedValue: sanitizeCurrency(data.estimatedValue),
        verifiedDamage: sanitizeCurrency(data.verifiedDamage),
        claimedAmount: sanitizeCurrency(data.claimedAmount),
        recoveredAmount: sanitizeCurrency(data.recoveredAmount),
        updatedAt: new Date(),
      })
      .where(eq(claimsSchema.id, claimId));

    revalidatePath('/dashboard/claims');
    return { success: true };
  } catch (error) {
    console.error(`[ClaimsAction] Failed to update economics for ${claimId}:`, error);
    return { success: false, error: 'Database update failed' };
  }
}
