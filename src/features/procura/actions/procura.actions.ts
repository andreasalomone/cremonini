'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { desc, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import type { NewPowerOfAttorney } from '@/models/Schema';
import { powerOfAttorneySchema } from '@/models/Schema';

import { GLOBAL_CREMONINI_ID, GLOBAL_CREMONINI_NAME } from '../constants';

/**
 * Get all Power of Attorney records for an organization.
 */
export async function getProcureByOrgId(targetOrgId?: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return [];
    }

    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;
    const queryOrgId = isSuperAdmin && targetOrgId ? targetOrgId : orgId;

    return await db.query.powerOfAttorneySchema.findMany({
      where: eq(powerOfAttorneySchema.orgId, queryOrgId),
      orderBy: [desc(powerOfAttorneySchema.createdAt)],
    });
  } catch (error) {
    logger.error('[ProcuraAction] getProcureByOrgId failed:', error);
    return [];
  }
}

/**
 * Get the most recent Power of Attorney for an organization.
 */
export async function getLatestProcura(targetOrgId?: string) {
  const procure = await getProcureByOrgId(targetOrgId);
  return procure[0] ?? null;
}

/**
 * Legacy: keep getProcura name but point to latest
 */
export async function getProcura(targetOrgId?: string) {
  return getLatestProcura(targetOrgId);
}

/**
 * Admin Action: Create a new Power of Attorney record.
 * Supports multiple records per organization.
 */
export async function createProcura(
  data: Omit<NewPowerOfAttorney, 'id' | 'createdAt' | 'updatedAt'>,
) {
  try {
    const { orgId, userId } = await auth();

    if (!orgId || !userId) {
      throw new Error('Unauthorized');
    }

    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

    // Only admin can upload for other orgs or the global group.
    // We check if data.orgId is truthy to avoid saving to empty string if using legacy upsertProcura.
    const finalOrgId = (isSuperAdmin && data.orgId) ? data.orgId : orgId;

    logger.info({ finalOrgId, userId }, 'Creating new PoA');

    await db.insert(powerOfAttorneySchema).values({
      ...data,
      orgId: finalOrgId,
    });

    revalidatePath('/dashboard/procura');
    return { success: true };
  } catch (error) {
    logger.error('[ProcuraAction] createProcura failed:', error);
    return { success: false, error: 'Database/Auth error' };
  }
}

/**
 * Create or update Power of Attorney for the current organization. (Legacy/Tenant)
 */
export async function upsertProcura(
  data: Omit<NewPowerOfAttorney, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>,
) {
  // Keep existing upsert for backward compatibility if needed,
  // but we prefer createProcura now.
  return createProcura({ ...data, orgId: '' }); // orgId will be forced to current org in createProcura if not admin
}

/**
 * Delete Power of Attorney for the current organization.
 */
export async function deleteProcura() {
  try {
    const { orgId, userId } = await auth();

    if (!orgId || !userId) {
      throw new Error('Unauthorized: No Organization or User context');
    }

    logger.info({ orgId, userId }, 'Deleting all PoAs for org');

    await db
      .delete(powerOfAttorneySchema)
      .where(eq(powerOfAttorneySchema.orgId, orgId));

    revalidatePath('/dashboard/procura');
    return { success: true };
  } catch (error) {
    logger.error('[ProcuraAction] deleteProcura failed:', error);
    return { success: false, error: 'Operation failed' };
  }
}

/**
 * Get all PoAs for S&A Admin overview.
 * Returns list of orgs with their PoA status.
 */
export async function getAllProcure() {
  try {
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
  } catch (error) {
    logger.error('[ProcuraAction] getAllProcure failed:', error);
    return [];
  }
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
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return new Map();
    }

    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;
    const uniqueOrgIds = [...new Set(orgIds)];

    // Add current org if not in list and not admin?
    // Actually, usually the input list is what we care about.

    // Add global ID if searching all or if admin
    const searchIds = isSuperAdmin ? [...uniqueOrgIds, GLOBAL_CREMONINI_ID] : uniqueOrgIds;

    if (searchIds.length === 0) {
      return new Map();
    }

    const procure = await db.query.powerOfAttorneySchema.findMany({
      where: inArray(powerOfAttorneySchema.orgId, searchIds),
      orderBy: [desc(powerOfAttorneySchema.createdAt)],
    });

    const statusMap = new Map<string, PoaStatus>();
    const procuraByOrg = new Map(procure.map(p => [p.orgId, p]));

    for (const id of searchIds) {
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
  } catch (error) {
    logger.error('[ProcuraAction] getPoaStatusByOrgIds failed:', error);
    return new Map();
  }
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
  try {
    const { orgId } = await auth();

    if (!orgId) {
      throw new Error('Unauthorized');
    }

    const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

    if (!isSuperAdmin) {
      throw new Error('Access denied: Admin only');
    }

    const client = await clerkClient();

    // SCALABILITY: Relax limit to 500.
    // If the group grows beyond 500 entities, we should implement proper cursor-pagination.
    const clerkOrgsResponse = await client.organizations.getOrganizationList({
      limit: 500,
    });

    const clerkOrgs = clerkOrgsResponse.data;
    const orgIds = clerkOrgs.map(org => org.id);

    // Get Procura status for all these orgs
    const statusMap = await getPoaStatusByOrgIds(orgIds);

    // Combine data
    const result: OrganizationProcuraStatus[] = [];

    // Add Global/Group row first
    result.push({
      id: GLOBAL_CREMONINI_ID,
      name: GLOBAL_CREMONINI_NAME,
      slug: 'global',
      imageUrl: '', // Or a group icon
      procura: statusMap.get(GLOBAL_CREMONINI_ID) ?? {
        hasPoA: false,
        isExpired: false,
        saAuthorizedToAct: false,
        saAuthorizedToCollect: false,
      },
    });

    // Add all other orgs
    result.push(...clerkOrgs.map(org => ({
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
    })));

    return result;
  } catch (error) {
    logger.error('[ProcuraAction] getAllOrganizationsWithProcuraStatus failed:', error);
    return [];
  }
}
