import { clerkClient } from '@clerk/nextjs/server';
import { addDays } from 'date-fns';
import { and, eq, lte, or } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

import { DeadlineAlert } from '@/components/emails/DeadlineAlert';
import { DEADLINES } from '@/constants/Deadlines';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { claimsSchema } from '@/models/Schema';

// Prevent static pre-rendering - this route requires runtime database access
export const dynamic = 'force-dynamic';

// Initialize Resend
const resend = new Resend(Env.RESEND_API_KEY);

/**
 * Process a single claim's notification using a pre-fetched email.
 */
async function processClaimNotification(
  claim: typeof claimsSchema.$inferSelect,
  email: string,
  threeDaysFromNow: Date,
  thirtyDaysFromNow: Date,
) {
  const isReserveExpiring = claim.reserveDeadline && new Date(claim.reserveDeadline) <= threeDaysFromNow && !claim.reserveNotificationSent;
  const isPrescriptionExpiring = claim.prescriptionDeadline && new Date(claim.prescriptionDeadline) <= thirtyDaysFromNow && !claim.prescriptionNotificationSent;

  const deadlineType = isReserveExpiring ? 'Riserva' : 'Prescrizione';

  const { error } = await resend.emails.send({
    from: 'S&A Claims <onboarding@resend.dev>',
    to: [email],
    subject: `Action Required: Claim Deadline approaching`,
    react: DeadlineAlert({
      claimId: claim.id,
      daysLeft: isReserveExpiring ? DEADLINES.NOTIFY_RESERVE_DAYS_BEFORE : DEADLINES.NOTIFY_PRESCRIPTION_DAYS_BEFORE,
      type: deadlineType,
      claimUrl: `${Env.NEXT_PUBLIC_APP_URL}/dashboard/claims`,
    }),
  });

  if (error) {
    throw error;
  }

  await db
    .update(claimsSchema)
    .set({
      reserveNotificationSent: isReserveExpiring ? true : claim.reserveNotificationSent,
      prescriptionNotificationSent: isPrescriptionExpiring ? true : claim.prescriptionNotificationSent,
    })
    .where(eq(claimsSchema.id, claim.id));

  return { claimId: claim.id, sentTo: email, type: deadlineType };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${Env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const threeDaysFromNow = addDays(now, DEADLINES.NOTIFY_RESERVE_DAYS_BEFORE);
    const thirtyDaysFromNow = addDays(now, DEADLINES.NOTIFY_PRESCRIPTION_DAYS_BEFORE);

    const formatDate = (d: Date): string => d.toISOString().split('T')[0]!;

    const expiringClaims = await db
      .select()
      .from(claimsSchema)
      .where(
        or(
          and(
            lte(claimsSchema.reserveDeadline, formatDate(threeDaysFromNow)),
            eq(claimsSchema.reserveNotificationSent, false),
          ),
          and(
            lte(claimsSchema.prescriptionDeadline, formatDate(thirtyDaysFromNow)),
            eq(claimsSchema.prescriptionNotificationSent, false),
          ),
        ),
      );

    if (expiringClaims.length === 0) {
      return NextResponse.json({ message: 'No expiring claims found' });
    }

    // 1. COLLECT ALL UNIQUE USER IDS
    const userIds = [...new Set(expiringClaims.map(c => c.creatorId).filter(Boolean))] as string[];

    // 2. BATCH FETCH USERS FROM CLERK (Anti N+1)
    const client = await clerkClient();
    const clerkUsersResponse = await client.users.getUserList({
      userId: userIds,
      limit: userIds.length,
    });

    const userEmailMap = new Map<string, string>();
    for (const user of clerkUsersResponse.data) {
      const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
      if (email) {
        userEmailMap.set(user.id, email);
      }
    }

    // 3. PROCESS NOTIFICATIONS
    const results = await Promise.allSettled(
      expiringClaims.map(async (claim) => {
        const email = claim.creatorId ? userEmailMap.get(claim.creatorId) : null;

        if (!email) {
          logger.warn({ claimId: claim.id, creatorId: claim.creatorId }, 'Skip claim: No valid email found for creator');
          return null;
        }

        return processClaimNotification(claim, email, threeDaysFromNow, thirtyDaysFromNow);
      }),
    );

    // 4. LOG ERROR RESULTS FOR OBSERVABILITY
    results.forEach((res, i) => {
      if (res.status === 'rejected') {
        logger.error({ claimId: expiringClaims[i]?.id, error: res.reason }, 'Notification failed for claim');
      }
    });

    const successful = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value !== null).length;

    return NextResponse.json({
      success: true,
      processed: successful,
      total: expiringClaims.length,
    });
  } catch (error) {
    logger.error({ error }, 'Cron Job Failed');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
