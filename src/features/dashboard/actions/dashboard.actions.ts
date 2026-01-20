'use server';

import { auth } from '@clerk/nextjs/server';
import { count, eq, sql, sum } from 'drizzle-orm';

import { DEADLINES } from '@/constants/Deadlines';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { claimsSchema } from '@/models/Schema';

export type DashboardStats = {
  totalClaims: number;
  activeClaims: number;
  criticalClaims: number;
  totalValue: number;
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
      // Fix: Handle Italian currency format (replace thousands '.' with empty, replace decimal ',' with '.')
      value: sum(
        sql`CASE WHEN ${claimsSchema.status} != 'CLOSED' THEN
          CAST(
            NULLIF(
              REGEXP_REPLACE(
                REPLACE(REPLACE(${claimsSchema.estimatedValue}, '.', ''), ',', '.'),
                '[^0-9.]', '', 'g'
              ),
              ''
            ) AS NUMERIC
          )
        ELSE 0 END`,
      ),
    })
    .from(claimsSchema)
    .where(isSuperAdmin ? undefined : eq(claimsSchema.orgId, orgId!));

  const stats = statsResult[0];

  return {
    totalClaims: Number(stats?.total ?? 0),
    activeClaims: Number(stats?.active ?? 0),
    criticalClaims: Number(stats?.critical ?? 0),
    totalValue: Number(stats?.value ?? 0),
  };
}
