'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import type { NewPowerOfAttorney } from '@/models/Schema';
import { powerOfAttorneySchema } from '@/models/Schema';

/**
 * Get Power of Attorney for an organization.
 * Each org has one active PoA record.
 */
export async function getProcura(targetOrgId?: string) {
  const { orgId } = await auth();

  if (!orgId) {
    return null;
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  // S&A admin can view any org's PoA, tenant can only view their own
  const queryOrgId = isSuperAdmin && targetOrgId ? targetOrgId : orgId;

  return await db.query.powerOfAttorneySchema.findFirst({
    where: eq(powerOfAttorneySchema.orgId, queryOrgId),
  });
}

/**
 * Create or update Power of Attorney for the current organization.
 * Only the org itself can upload their PoA.
 */
export async function upsertProcura(
  data: Omit<NewPowerOfAttorney, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>,
) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    throw new Error('Unauthorized: No Organization or User context');
  }

  // Check if PoA already exists
  const existing = await db.query.powerOfAttorneySchema.findFirst({
    where: eq(powerOfAttorneySchema.orgId, orgId),
    columns: { id: true },
  });

  if (existing) {
    // Update existing
    await db
      .update(powerOfAttorneySchema)
      .set({
        documentUrl: data.documentUrl,
        documentPath: data.documentPath,
        expiryDate: data.expiryDate,
        saAuthorizedToAct: data.saAuthorizedToAct ?? false,
        saAuthorizedToCollect: data.saAuthorizedToCollect ?? false,
        updatedAt: new Date(),
      })
      .where(eq(powerOfAttorneySchema.id, existing.id));
  } else {
    // Insert new
    await db.insert(powerOfAttorneySchema).values({
      orgId,
      documentUrl: data.documentUrl,
      documentPath: data.documentPath,
      expiryDate: data.expiryDate,
      saAuthorizedToAct: data.saAuthorizedToAct ?? false,
      saAuthorizedToCollect: data.saAuthorizedToCollect ?? false,
    });
  }

  revalidatePath('/dashboard/procura');
  return { success: true };
}

/**
 * Delete Power of Attorney for the current organization.
 */
export async function deleteProcura() {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    throw new Error('Unauthorized: No Organization or User context');
  }

  await db
    .delete(powerOfAttorneySchema)
    .where(eq(powerOfAttorneySchema.orgId, orgId));

  revalidatePath('/dashboard/procura');
  return { success: true };
}

/**
 * Get all PoAs for S&A Admin overview.
 * Returns list of orgs with their PoA status.
 */
export async function getAllProcure() {
  const { orgId } = await auth();

  if (!orgId) {
    return [];
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  if (!isSuperAdmin) {
    throw new Error('Access denied: Admin only');
  }

  return await db.query.powerOfAttorneySchema.findMany({
    orderBy: powerOfAttorneySchema.updatedAt,
  });
}

// PoA status for display in claims table
export type PoaStatus = {
  hasPoA: boolean;
  isExpired: boolean;
  saAuthorizedToAct: boolean;
  saAuthorizedToCollect: boolean;
};

/**
 * Get PoA status for multiple organizations.
 * Used by S&A admin to see warning badges in claims table.
 */
export async function getPoaStatusByOrgIds(orgIds: string[]): Promise<Map<string, PoaStatus>> {
  const { orgId } = await auth();

  if (!orgId) {
    return new Map();
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  if (!isSuperAdmin) {
    // Non-admins get their own org's status only
    const procura = await db.query.powerOfAttorneySchema.findFirst({
      where: eq(powerOfAttorneySchema.orgId, orgId),
    });

    const status: PoaStatus = procura
      ? {
          hasPoA: true,
          isExpired: procura.expiryDate
            ? new Date(procura.expiryDate) < new Date()
            : false,
          saAuthorizedToAct: procura.saAuthorizedToAct ?? false,
          saAuthorizedToCollect: procura.saAuthorizedToCollect ?? false,
        }
      : {
          hasPoA: false,
          isExpired: false,
          saAuthorizedToAct: false,
          saAuthorizedToCollect: false,
        };

    return new Map([[orgId, status]]);
  }

  // Admin: fetch all PoAs for the given org IDs
  const uniqueOrgIds = [...new Set(orgIds)];

  if (uniqueOrgIds.length === 0) {
    return new Map();
  }

  // ✅ AUDIT FIX: Filter by IDs in DB instead of fetching all
  const procure = await db.query.powerOfAttorneySchema.findMany({
    where: inArray(powerOfAttorneySchema.orgId, uniqueOrgIds),
  });

  const statusMap = new Map<string, PoaStatus>();
  const procuraByOrg = new Map(procure.map(p => [p.orgId, p]));

  for (const id of uniqueOrgIds) {
    const procura = procuraByOrg.get(id);
    statusMap.set(id, procura
      ? {
          hasPoA: true,
          isExpired: procura.expiryDate
            ? new Date(procura.expiryDate) < new Date()
            : false,
          saAuthorizedToAct: procura.saAuthorizedToAct ?? false,
          saAuthorizedToCollect: procura.saAuthorizedToCollect ?? false,
        }
      : {
          hasPoA: false,
          isExpired: false,
          saAuthorizedToAct: false,
          saAuthorizedToCollect: false,
        });
  }

  return statusMap;
}

export type OrganizationProcuraStatus = {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string;
  procura: PoaStatus;
};

/**
 * Super Admin Action: Get all organizations with their Procura status.
 * Fetches Org details from Clerk and Procura status from DB.
 */
export async function getAllOrganizationsWithProcuraStatus(): Promise<OrganizationProcuraStatus[]> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('Unauthorized');
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  if (!isSuperAdmin) {
    throw new Error('Access denied: Admin only');
  }

  const client = await clerkClient();

  // Fetch all organizations from Clerk (limit 100 for now, add pagination if needed later)
  // We use this to get the names which are not in our DB
  const clerkOrgsResponse = await client.organizations.getOrganizationList({
    limit: 100,
  });

  const clerkOrgs = clerkOrgsResponse.data;
  const orgIds = clerkOrgs.map(org => org.id);

  // Get Procura status for all these orgs
  const statusMap = await getPoaStatusByOrgIds(orgIds);

  // Combine data
  return clerkOrgs.map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    imageUrl: org.imageUrl,
    procura: statusMap.get(org.id) ?? {
      hasPoA: false,
      isExpired: false,
      saAuthorizedToAct: false,
      saAuthorizedToCollect: false,
    },
  }));
}
