import { getClaims } from '@/features/claims/actions/claims.actions';
import { ClaimsTable } from '@/features/claims/components/ClaimsTable';
import { getDashboardStats } from '@/features/dashboard/actions/dashboard.actions';
import { ClaimsOverview } from '@/features/dashboard/components/ClaimsOverview';
import { StatsGrid } from '@/features/dashboard/components/StatsGrid';
import { logger } from '@/libs/Logger';

// Prevent static pre-rendering - this page requires runtime database access
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  logger.info('[DashboardPage] Starting data fetch...');
  const stats = await getDashboardStats();
  logger.info('[DashboardPage] Stats fetched successfully');
  const claims = await getClaims();
  logger.info('[DashboardPage] Claims fetched successfully');

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground">Monitor real-time claim metrics and deadlines.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <StatsGrid {...stats} />
        <ClaimsOverview open={stats.activeClaims} total={stats.totalClaims} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Latest Claims</h2>
        <ClaimsTable claims={claims} />
      </div>
    </div>
  );
}
