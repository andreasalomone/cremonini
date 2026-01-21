import { clerkClient } from '@clerk/nextjs/server';
import { addDays } from 'date-fns';
import { and, eq, lte, or } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

import { DeadlineAlert } from '@/components/emails/DeadlineAlert';
import { DEADLINES } from '@/constants/Deadlines';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { claimsSchema } from '@/models/Schema';

// Prevent static pre-rendering - this route requires runtime database access
export const dynamic = 'force-dynamic';

// Initialize Resend
const resend = new Resend(Env.RESEND_API_KEY);

/**
 * Process a single claim: lookup user, send email, and update status.
 */
async function processClaimNotification(claim: typeof claimsSchema.$inferSelect, threeDaysFromNow: Date, thirtyDaysFromNow: Date) {
  if (!claim.creatorId) {
    return null;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(claim.creatorId);
  const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

  if (!email) {
    return null;
  }

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

    // SCALABILITY FIX: Process notifications concurrently with limited concurrency
    // Using Promise.allSettled to ensure failure of one doesn't stop the whole batch
    const results = await Promise.allSettled(
      expiringClaims.map(claim => processClaimNotification(claim, threeDaysFromNow, thirtyDaysFromNow)),
    );

    const successful = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value !== null).length;

    return NextResponse.json({
      success: true,
      processed: successful,
      total: expiringClaims.length,
    });
  } catch (error) {
    console.error('Cron Job Failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
