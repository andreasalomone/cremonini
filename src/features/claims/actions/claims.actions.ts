'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { checkIsSuperAdmin } from '@/libs/auth-utils';
import { db } from '@/libs/DB';
import { calculateDeadlines, calculateExtendedDeadline } from '@/libs/deadline-logic';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { getSignedUrl } from '@/libs/supabase-storage';
import { claimActivitiesSchema, claimsSchema } from '@/models/Schema';

import { CLAIM_STATUS_OPTIONS, type ClaimStatus } from '../constants';

// Types
export type CreateClaimInput = {
  type: 'TERRESTRIAL' | 'MARITIME' | 'AIR' | 'RAIL' | 'STOCK_IN_TRANSIT';
  state: 'NATIONAL' | 'INTERNATIONAL';
  eventDate: Date;
  location: string;
  documentNumber?: string;
  hasThirdPartyResponsible?: boolean;
  thirdPartyName?: string;
  carrierName?: string;
  estimatedValue?: string;
  estimatedRecovery?: string;
  description?: string;
  documentPath?: string;
  stockInboundDate?: Date;
  stockOutboundDate?: Date;
  hasStockInboundReserve?: boolean;
  hasGrossNegligence?: boolean;
  targetOrgId?: string; // Optional target organization for SuperAdmins
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
 * Standardizes activity recording inside a transaction.
 */
async function recordActivity(
  tx: any,
  claimId: string,
  userId: string,
  type: 'CREATED' | 'STATUS_CHANGE' | 'DOC_UPLOAD' | 'DOC_DELETE' | 'INFO_UPDATE' | 'ECONOMICS_UPDATE',
  description: string,
  metadata?: any,
) {
  try {
    await tx.insert(claimActivitiesSchema).values({
      claimId,
      userId,
      actionType: type,
      description,
      metadata,
    });
  } catch (error) {
    logger.error(`[ClaimsAction] Failed to record activity for claim ${claimId}:`, error);
    // We don't throw here to avoid rolling back the main transaction if logging fails,
    // OR we could throw if we want strict audit trail. In this case, let's keep it strict.
    throw error;
  }
}

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
      logger.warn('[ClaimsAction] No orgId found in auth context');
      return [];
    }

    // --- GOD MODE LOGIC ---
    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;
    logger.info(`[ClaimsAction] Fetching claims for orgId: ${orgId} (isSuperAdmin: ${isSuperAdmin})`);

    // ✅ AUDIT FIX: Use query API with relations instead of select()
    const results = await db.query.claimsSchema.findMany({
      where: isSuperAdmin ? undefined : eq(claimsSchema.orgId, orgId),
      with: { documents: true },
      orderBy: desc(claimsSchema.createdAt),
      limit: isSuperAdmin ? 100 : undefined,
    });

    logger.info(`[ClaimsAction] Successfully fetched ${results.length} claims`);
    return results;
  } catch (error) {
    logger.error('[ClaimsAction] getClaims failed:', error);
    return [];
  }
}

/**
 * Fetch a single claim with its full context.
 * Enforces organization-level access control.
 */
export async function getClaimById(id: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      logger.warn('[ClaimsAction] No orgId found in auth context');
      return null;
    }

    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

    const result = await db.query.claimsSchema.findFirst({
      where: and(
        eq(claimsSchema.id, id),
        isSuperAdmin ? undefined : eq(claimsSchema.orgId, orgId),
      ),
      with: {
        documents: true,
        activities: {
          orderBy: desc(claimActivitiesSchema.createdAt),
        },
      },
    });

    if (!result) {
      logger.warn(`[ClaimsAction] Claim ${id} not found or access denied for org ${orgId}`);
      return null;
    }

    return result;
  } catch (error) {
    logger.error(`[ClaimsAction] getClaimById failed for ${id}:`, error);
    return null;
  }
}

export async function createClaim(data: CreateClaimInput) {
  const { orgId, userId } = await auth();

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  let targetOrgId = orgId;

  if (isSuperAdmin) {
    if (!data.targetOrgId) {
      throw new Error('SuperAdmin must select a target organization.');
    }
    targetOrgId = data.targetOrgId;
    logger.info(`[SuperAdmin] User ${userId} creating claim for organization ${targetOrgId}`);
  }

  if (!userId || !targetOrgId) {
    throw new Error('Unauthorized: Missing User or Organization context');
  }

  // --- AUTOMATED DEADLINE LOGIC ---
  const eventDate = new Date(data.eventDate);
  const { reserveDeadline, prescriptionDeadline } = calculateDeadlines({
    eventDate,
    type: data.type,
    state: data.state,
    hasGrossNegligence: data.hasGrossNegligence,
    stockInboundDate: data.stockInboundDate,
    stockOutboundDate: data.stockOutboundDate,
    hasStockInboundReserve: data.hasStockInboundReserve,
  });

  const newClaim: typeof claimsSchema.$inferInsert = {
    orgId: targetOrgId,
    creatorId: userId,
    status: 'OPEN',
    type: data.type,
    state: data.state,
    eventDate: formatDate(eventDate),
    location: data.location,
    documentNumber: data.documentNumber,
    hasThirdPartyResponsible: data.hasThirdPartyResponsible ?? false,
    thirdPartyName: data.thirdPartyName,
    carrierName: data.carrierName,
    estimatedValue: sanitizeCurrency(data.estimatedValue),
    estimatedRecovery: sanitizeCurrency(data.estimatedRecovery),
    description: data.description,
    documentPath: data.documentPath,
    reserveDeadline: formatDateNullable(reserveDeadline),
    prescriptionDeadline: formatDateNullable(prescriptionDeadline),
    stockInboundDate: data.stockInboundDate ? formatDate(data.stockInboundDate) : null,
    stockOutboundDate: data.stockOutboundDate ? formatDate(data.stockOutboundDate) : null,
    hasStockInboundReserve: data.hasStockInboundReserve ?? false,
    hasGrossNegligence: data.hasGrossNegligence ?? false,
  };

  const result = await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(claimsSchema).values(newClaim).returning();

    if (!inserted) {
      throw new Error('Failed to insert claim');
    }

    await recordActivity(
      tx,
      inserted.id,
      userId,
      'CREATED',
      'Sinistro aperto',
      { status: 'OPEN' },
    );

    return inserted;
  });

  revalidatePath('/dashboard/claims');
  return { success: true, claimId: result.id };
}

export async function updateClaimStatus(claimId: string, newStatus: ClaimStatus) {
  const { orgId, userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const isSuperAdmin = checkIsSuperAdmin(orgId);

  // 🔒 PERMISSION: Only SuperAdmin can change claim status
  if (!isSuperAdmin) {
    logger.warn(`[ClaimsAction] Non-admin user ${userId} attempted status change on ${claimId}`);
    return { success: false, error: 'Solo gli amministratori possono modificare lo stato' };
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
    const result = await db.transaction(async (tx) => {
      // 1. Fetch current status for audit trail and verify ownership
      const existing = await tx.query.claimsSchema.findFirst({
        where: and(
          eq(claimsSchema.id, claimId),
          isSuperAdmin ? undefined : eq(claimsSchema.orgId, orgId!),
        ),
        columns: { status: true },
      });

      if (!existing) {
        throw new Error('Claim not found or access denied');
      }

      // 2. Update the claim
      await tx
        .update(claimsSchema)
        .set(dataToUpdate)
        .where(eq(claimsSchema.id, claimId));

      // 3. record the activity
      const statusLabel = CLAIM_STATUS_OPTIONS.find(opt => opt.value === newStatus)?.label || newStatus;
      await recordActivity(
        tx,
        claimId,
        userId,
        'STATUS_CHANGE',
        `Stato cambiato in: ${statusLabel}`,
        { oldStatus: existing.status, newStatus },
      );

      return { success: true };
    });

    revalidatePath('/dashboard/claims');
    revalidatePath(`/dashboard/claims/${claimId}`);
    return result;
  } catch (error) {
    logger.error(`[ClaimsAction] Failed to update claim ${claimId} status:`, error);
    return { success: false, error: 'Database update failed' };
  }
}

// Economic data update type
export type UpdateClaimEconomicsInput = {
  estimatedValue?: string;
  verifiedDamage?: string;
  claimedAmount?: string;
  recoveredAmount?: string;
  estimatedRecovery?: string;
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

  const isSuperAdmin = checkIsSuperAdmin(orgId);

  // 🔒 PERMISSION: Only SuperAdmin can update economics
  if (!isSuperAdmin) {
    logger.warn(`[ClaimsAction] Non-admin user ${userId} attempted economics update on ${claimId}`);
    return { success: false, error: 'Solo gli amministratori possono modificare i dati economici' };
  }

  try {
    const result = await db.transaction(async (tx) => {
      await tx
        .update(claimsSchema)
        .set({
          estimatedValue: sanitizeCurrency(data.estimatedValue),
          verifiedDamage: sanitizeCurrency(data.verifiedDamage),
          claimedAmount: sanitizeCurrency(data.claimedAmount),
          recoveredAmount: sanitizeCurrency(data.recoveredAmount),
          estimatedRecovery: sanitizeCurrency(data.estimatedRecovery),
          updatedAt: new Date(),
        })
        .where(eq(claimsSchema.id, claimId));

      await recordActivity(
        tx,
        claimId,
        userId,
        'ECONOMICS_UPDATE',
        'Dati economici aggiornati',
        data,
      );

      return { success: true };
    });

    revalidatePath('/dashboard/claims');
    revalidatePath(`/dashboard/claims/${claimId}`);
    return result;
  } catch (error) {
    logger.error(`[ClaimsAction] Failed to update economics for ${claimId}:`, error);
    return { success: false, error: 'Database update failed' };
  }
}

/**
 * Get a temporary signed URL for viewing/downloading a document.
 */
export async function getDocumentUrl(path: string) {
  const { orgId } = await auth();
  if (!orgId) {
    throw new Error('Unauthorized');
  }

  // 🔒 CRITICAL SECURITY CHECK: Ensure the path starts with the user's orgId
  // Paths are stored as "org_id/folder/uuid.ext"
  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;
  if (!isSuperAdmin && !path.startsWith(`${orgId}/`)) {
    logger.error(`[ClaimsAction] Security Alert: User ${orgId} attempted to access cross-org path: ${path}`);
    throw new Error('Access Denied');
  }

  try {
    return await getSignedUrl(path);
  } catch (error) {
    logger.error(`[ClaimsAction] Failed to get signed URL for ${path}:`, error);
    return null;
  }
}

/**
 * Super Admin Action: Get all organization options from Clerk.
 */
export async function getOrganizationOptions() {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('Unauthorized');
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  if (!isSuperAdmin) {
    throw new Error('Access denied: Admin only');
  }

  const client = await clerkClient();

  // Fetch all organizations from Clerk (limit 100 for now)
  const clerkOrgsResponse = await client.organizations.getOrganizationList({
    limit: 100,
  });

  return clerkOrgsResponse.data.map(org => ({
    id: org.id,
    name: org.name,
  }));
}
