'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

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

  const claims = isSuperAdmin
    ? await db.select().from(claimsSchema)
    : orgId
      ? await db.select().from(claimsSchema).where(eq(claimsSchema.orgId, orgId))
      : [];

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  let totalClaims = 0;
  let activeClaims = 0;
  let criticalClaims = 0;
  let totalValue = 0;

  claims.forEach((claim) => {
    totalClaims++;

    if (claim.status !== 'CLOSED') {
      activeClaims++;

      // Calculate totalValue for open claims
      if (claim.estimatedValue) {
        // Handle numeric conversion safely
        const val = Number.parseFloat(claim.estimatedValue.replace(/[^0-9.]/g, ''));
        if (!Number.isNaN(val)) {
          totalValue += val;
        }
      }

      // Critical logic
      const reserveDate = claim.reserveDeadline ? new Date(claim.reserveDeadline) : null;
      const prescriptionDate = claim.prescriptionDeadline ? new Date(claim.prescriptionDeadline) : null;

      const isReserveCritical = reserveDate && reserveDate <= sevenDaysFromNow;
      const isPrescriptionCritical = prescriptionDate && prescriptionDate <= thirtyDaysFromNow;

      if (isReserveCritical || isPrescriptionCritical) {
        criticalClaims++;
      }
    }
  });

  return {
    totalClaims,
    activeClaims,
    criticalClaims,
    totalValue,
  };
}
