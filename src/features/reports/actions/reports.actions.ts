'use server';

import { auth } from '@clerk/nextjs/server';
import { and, count, eq, gte, lte, sql, sum } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { claimsSchema } from '@/models/Schema';

export type SocietyReport = {
  orgId: string;
  totalClaims: number;
  estimatedTotal: number;
  recoveredTotal: number;
  recoveryRate: number;
};

export type PeriodReport = {
  period: string;
  totalClaims: number;
  estimatedTotal: number;
  recoveredTotal: number;
};

/**
 * Get report grouped by society (org).
 * S&A Admin only.
 */
export async function getReportBySociety(
  startDate?: string,
  endDate?: string,
): Promise<SocietyReport[]> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('Unauthorized');
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  if (!isSuperAdmin) {
    throw new Error('Reports are S&A admin only');
  }

  const conditions = [];
  if (startDate) {
    conditions.push(gte(claimsSchema.createdAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(claimsSchema.createdAt, new Date(endDate)));
  }

  try {
    const result = await db
      .select({
        orgId: claimsSchema.orgId,
        total: count(),
        estimated: sum(claimsSchema.estimatedValue),
        recovered: sum(claimsSchema.recoveredAmount),
      })
      .from(claimsSchema)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(claimsSchema.orgId);

    return result.map(row => ({
      orgId: row.orgId,
      totalClaims: Number(row.total ?? 0),
      estimatedTotal: Number(row.estimated ?? 0),
      recoveredTotal: Number(row.recovered ?? 0),
      recoveryRate:
        Number(row.estimated ?? 0) > 0
          ? Number(row.recovered ?? 0) / Number(row.estimated ?? 0)
          : 0,
    }));
  } catch (error) {
    console.error('[ReportsAction] getReportBySociety failed:', error);
    return [];
  }
}

/**
 * Get report grouped by period (month).
 * S&A Admin only.
 */
export async function getReportByPeriod(
  year: number,
  orgIdFilter?: string,
): Promise<PeriodReport[]> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('Unauthorized');
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  // Non-admins can only see their own org's report
  const targetOrgId = isSuperAdmin && orgIdFilter ? orgIdFilter : orgId;

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  const conditions = [
    gte(claimsSchema.createdAt, startOfYear),
    lte(claimsSchema.createdAt, endOfYear),
  ];

  if (!isSuperAdmin || orgIdFilter) {
    conditions.push(eq(claimsSchema.orgId, targetOrgId));
  }

  try {
    const result = await db
      .select({
        month: sql<string>`TO_CHAR(${claimsSchema.createdAt}, 'YYYY-MM')`,
        total: count(),
        estimated: sum(claimsSchema.estimatedValue),
        recovered: sum(claimsSchema.recoveredAmount),
      })
      .from(claimsSchema)
      .where(and(...conditions))
      .groupBy(sql`TO_CHAR(${claimsSchema.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${claimsSchema.createdAt}, 'YYYY-MM')`);

    return result.map(row => ({
      period: row.month,
      totalClaims: Number(row.total ?? 0),
      estimatedTotal: Number(row.estimated ?? 0),
      recoveredTotal: Number(row.recovered ?? 0),
    }));
  } catch (error) {
    console.error('[ReportsAction] getReportByPeriod failed:', error);
    return [];
  }
}

/**
 * Get recovery vs non-recovery report.
 * Shows claims with full, partial, or no recovery.
 */
export async function getRecoveryReport(startDate?: string, endDate?: string) {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('Unauthorized');
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  const conditions = [];
  if (!isSuperAdmin) {
    conditions.push(eq(claimsSchema.orgId, orgId));
  }
  if (startDate) {
    conditions.push(gte(claimsSchema.createdAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(claimsSchema.createdAt, new Date(endDate)));
  }

  try {
    const result = await db
      .select({
        status: claimsSchema.status,
        total: count(),
        estimated: sum(claimsSchema.estimatedValue),
        recovered: sum(claimsSchema.recoveredAmount),
      })
      .from(claimsSchema)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(claimsSchema.status);

    // Group into categories
    const fullRecovery = result.filter(r => r.status === 'FULL_RECOVERY');
    const partialRecovery = result.filter(r => r.status === 'PARTIAL_RECOVERY');
    const noRecovery = result.filter(r => r.status === 'CLOSED');
    const pending = result.filter(r =>
      r.status !== 'CLOSED'
      && r.status !== 'FULL_RECOVERY'
      && r.status !== 'PARTIAL_RECOVERY',
    );

    const sumUp = (rows: typeof result) => ({
      count: rows.reduce((acc, r) => acc + Number(r.total ?? 0), 0),
      estimated: rows.reduce((acc, r) => acc + Number(r.estimated ?? 0), 0),
      recovered: rows.reduce((acc, r) => acc + Number(r.recovered ?? 0), 0),
    });

    return {
      fullRecovery: sumUp(fullRecovery),
      partialRecovery: sumUp(partialRecovery),
      noRecovery: sumUp(noRecovery),
      pending: sumUp(pending),
    };
  } catch (error) {
    console.error('[ReportsAction] getRecoveryReport failed:', error);
    return {
      fullRecovery: { count: 0, estimated: 0, recovered: 0 },
      partialRecovery: { count: 0, estimated: 0, recovered: 0 },
      noRecovery: { count: 0, estimated: 0, recovered: 0 },
      pending: { count: 0, estimated: 0, recovered: 0 },
    };
  }
}
