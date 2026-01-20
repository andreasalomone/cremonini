'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { addDays, addYears } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/libs/DB';
import { claimsSchema } from '@/models/Schema';

// Claim status enum type for type safety
export type ClaimStatus = 'OPEN' | 'DOCS_COLLECTION' | 'NEGOTIATION' | 'CLOSED';

export const CLAIM_STATUS_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'DOCS_COLLECTION', label: 'Docs Collection' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'CLOSED', label: 'Closed' },
];

// Types (can be moved to a types file)
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
 * S&A Admin sees ALL.
 * Company Rep sees ONLY their org.
 */
export async function getClaims() {
  const { orgId } = await auth();
  const user = await currentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // --- GOD MODE LOGIC ---
  const isSaAdmin = user.publicMetadata?.role === 'ADMIN_SA';

  if (isSaAdmin) {
    // S&A Admin: Fetch ALL claims
    // Optionally we could support filtering by query params here
    return await db.select().from(claimsSchema);
  }

  // Regular User: Must enforce OrgId
  if (!orgId) {
    // If no active org context, return empty or throw
    return [];
  }

  return await db.select().from(claimsSchema).where(eq(claimsSchema.orgId, orgId));
}

export async function createClaim(data: CreateClaimInput) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    throw new Error('Unauthorized: No Organization or User context');
  }

  console.log('Creating claim for org:', orgId, 'by user:', userId);

  // --- AUTOMATED DEADLINE LOGIC ---
  const eventDate = new Date(data.eventDate);
  const reserveDeadline = addDays(eventDate, 7); // Default 7 days
  const prescriptionDeadline = addYears(eventDate, 1); // Default 1 year

  // Note: Drizzle `date` column expects string 'YYYY-MM-DD' usually
  // We explicitly convert dates to strings to satisfy Drizzle types if needed,
  // or rely on driver coercion. Ideally schema should specify { mode: 'date' }
  // but for now we pass .toISOString().split('T')[0] to be safe with standard date types.

  const formatDate = (d: Date) => d.toISOString().split('T')[0]!;

  await db.insert(claimsSchema).values({
    orgId,
    creatorId: userId,
    status: 'OPEN',
    type: data.type,
    // @ts-ignore: Drizzle type safety for Date vs String can be tricky here
    eventDate: formatDate(eventDate),
    carrierName: data.carrierName,
    estimatedValue: data.estimatedValue,
    description: data.description,
    documentUrl: data.documentUrl,
    // @ts-ignore
    reserveDeadline: formatDate(reserveDeadline),
    // @ts-ignore
    prescriptionDeadline: formatDate(prescriptionDeadline),
  });

  return { success: true };
}

export async function updateClaimStatus(claimId: string, newStatus: ClaimStatus) {
  const { orgId } = await auth();
  const user = await currentUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // --- GOD MODE LOGIC ---
  const isSaAdmin = user.publicMetadata?.role === 'ADMIN_SA';

  // If NOT admin and NO org context, deny
  if (!isSaAdmin && !orgId) {
    return { success: false, error: 'Unauthorized: No Organization context' };
  }

  // Validate the claim ownership if not Admin
  if (!isSaAdmin) {
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

  // If closing, set closedAt
  if (newStatus === 'CLOSED') {
    dataToUpdate.closedAt = new Date();
  }

  try {
    await db
      .update(claimsSchema)
      .set(dataToUpdate)
      .where(eq(claimsSchema.id, claimId));

    revalidatePath('/dashboard/claims');
    return { success: true };
  } catch (error) {
    console.error('Failed to update claim status:', error);
    return { success: false, error: 'Database update failed' };
  }
}
