import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import {
  getRecoveryReport,
  getReportBySociety,
} from '@/features/reports/actions/reports.actions';
import {
  RecoveryStatsCards,
  SocietyReportTable,
} from '@/features/reports/components';
import { Env } from '@/libs/Env';

// Prevent static pre-rendering - this page requires runtime database access
export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const { orgId } = await auth();

  if (!orgId) {
    redirect('/sign-in');
  }

  const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  // Companies can see their own reports, S&A sees all
  const [societyReport, recoveryReport] = await Promise.all([
    isSuperAdmin ? getReportBySociety() : [], // Societies table only for S&A
    getRecoveryReport(), // Recovery stats filtered by orgId in the action
  ]);

  return (
    <div className="container mx-auto space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportistica Avanzata</h1>
        <p className="text-muted-foreground">
          Visualizza le performance di recupero per società e periodi.
        </p>
      </div>

      <RecoveryStatsCards data={recoveryReport} />

      {isSuperAdmin && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">Performance per Società</h2>
          <SocietyReportTable data={societyReport} />
        </div>
      )}
    </div>
  );
}
