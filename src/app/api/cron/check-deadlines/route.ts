import { clerkClient } from '@clerk/nextjs/server';
import { addDays } from 'date-fns';
import { and, eq, lte, or } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

import { DeadlineAlert } from '@/components/emails/DeadlineAlert';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { claimsSchema } from '@/models/Schema';

// Initialize Resend
const resend = new Resend(Env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  // 1. Authentication via CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${Env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);
    const thirtyDaysFromNow = addDays(now, 30);

    const formatDate = (d: Date): string => d.toISOString().split('T')[0]!;

    // 2. Query for expiring claims (Sweep Logic)
    // - Reserve deadline is <= 3 days away AND not notified
    // - Prescription deadline is <= 30 days away AND not notified
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

    const results = [];

    // 3. Loop & Lookup
    for (const claim of expiringClaims) {
      if (!claim.creatorId) {
        continue;
      }

      try {
        // Direct Clerk Lookup
        const client = await clerkClient();
        const user = await client.users.getUser(claim.creatorId);
        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        if (!email) {
          console.error(`No email found for user ${claim.creatorId}`);
          continue;
        }

        const isReserveExpiring = claim.reserveDeadline && new Date(claim.reserveDeadline) <= threeDaysFromNow && !claim.reserveNotificationSent;
        const isPrescriptionExpiring = claim.prescriptionDeadline && new Date(claim.prescriptionDeadline) <= thirtyDaysFromNow && !claim.prescriptionNotificationSent;

        const deadlineType = isReserveExpiring ? 'Riserva' : 'Prescrizione';

        // 4. Send Email
        const { error } = await resend.emails.send({
          from: 'S&A Claims <onboarding@resend.dev>', // Update with your verify domain in prod
          to: [email],
          subject: `Action Required: Claim Deadline approaching`,
          react: DeadlineAlert({
            claimId: claim.id,
            daysLeft: isReserveExpiring ? 3 : 30, // Approximate for template
            type: deadlineType,
            claimUrl: `${Env.NEXT_PUBLIC_APP_URL}/dashboard/claims`,
          }),
        });

        if (error) {
          console.error('Resend Error:', error);
          continue;
        }

        // 5. Update DB Flags
        await db
          .update(claimsSchema)
          .set({
            reserveNotificationSent: isReserveExpiring ? true : claim.reserveNotificationSent,
            prescriptionNotificationSent: isPrescriptionExpiring ? true : claim.prescriptionNotificationSent,
          })
          .where(eq(claimsSchema.id, claim.id));

        results.push({ claimId: claim.id, sentTo: email, type: deadlineType });
      } catch (innerError) {
        console.error(`Failed to process claim ${claim.id}:`, innerError);
      }
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });
  } catch (error) {
    console.error('Cron Job Failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
