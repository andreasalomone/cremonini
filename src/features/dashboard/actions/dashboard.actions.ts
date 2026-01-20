'use server';

import { auth } from '@clerk/nextjs/server';
import { count, eq, sql, sum } from 'drizzle-orm';

import { DEADLINES } from '@/constants/Deadlines';
import { ECONOMICS } from '@/constants/Economics';
import { db } from '@/libs/DB';
import { parseCurrencySql } from '@/libs/DBUtils';
import { Env } from '@/libs/Env';
import { claimsSchema } from '@/models/Schema';

export type DashboardStats = {
  totalClaims: number;
  activeClaims: number;
  criticalClaims: number;
  totalValue: number;
  totalRecovered: number;
  recoveryRate: number;
  aggregateDeductibleResidual: number;
};

/**
 * Computes dashboard statistics based on user role (Admin vs Tenant).
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { orgId, userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // God Mode vs Tenant logic
  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  // Optimized SQL aggregates to avoid fetching all rows into memory
  const statsResult = await db
    .select({
      total: count(),
      active: count(sql`CASE WHEN ${claimsSchema.status} != 'CLOSED' THEN 1 END`),
      // Critical logic: using centralized constants (reserve <= 7 days OR prescription <= 30 days)
      critical: count(
        sql`CASE WHEN ${claimsSchema.status} != 'CLOSED' AND (
          ${claimsSchema.reserveDeadline} <= (CURRENT_DATE + (INTERVAL '1 day' * ${DEADLINES.CRITICAL_RESERVE_THRESHOLD_DAYS}))::text OR
          ${claimsSchema.prescriptionDeadline} <= (CURRENT_DATE + (INTERVAL '1 day' * ${DEADLINES.CRITICAL_PRESCRIPTION_THRESHOLD_DAYS}))::text
        ) THEN 1 END`,
      ),
      // Total estimated value of active claims
      value: sum(
        sql`CASE WHEN ${claimsSchema.status} != 'CLOSED' THEN ${parseCurrencySql(claimsSchema.estimatedValue)} ELSE 0 END`,
      ),
      // Total recovered amount
      recovered: sum(parseCurrencySql(claimsSchema.recoveredAmount)),
      // Total verified damage for aggregate deductible
      verified: sum(parseCurrencySql(claimsSchema.verifiedDamage)),
      // Total claimed for recovery rate calculation
      claimed: sum(parseCurrencySql(claimsSchema.claimedAmount)),
    })
    .from(claimsSchema)
    .where(isSuperAdmin ? undefined : eq(claimsSchema.orgId, orgId!));

  const stats = statsResult[0];

  const totalRecovered = Number(stats?.recovered ?? 0);
  const totalClaimed = Number(stats?.claimed ?? 0);
  const totalVerifiedDamage = Number(stats?.verified ?? 0);

  // --- US 6.2: AGGREGATE DEDUCTIBLE LOGIC ---
  // The aggregate deductible is used by verified damages and "refilled" by recoveries.
  // Formula: LIMIT - (VERIFIED - RECOVERED)
  const usedDeductible = Math.max(0, totalVerifiedDamage - totalRecovered);
  const residualDeductible = Math.max(0, ECONOMICS.ANNUAL_AGGREGATE_DEDUCTIBLE - usedDeductible);

  return {
    totalClaims: Number(stats?.total ?? 0),
    activeClaims: Number(stats?.active ?? 0),
    criticalClaims: Number(stats?.critical ?? 0),
    totalValue: Number(stats?.value ?? 0),
    totalRecovered,
    recoveryRate: totalClaimed > 0 ? totalRecovered / totalClaimed : 0,
    aggregateDeductibleResidual: residualDeductible,
  };
}
