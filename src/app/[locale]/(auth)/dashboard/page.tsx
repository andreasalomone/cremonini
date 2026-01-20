import { getClaims } from '@/features/claims/actions/claims.actions';
import { ClaimsTable } from '@/features/claims/components/ClaimsTable';
import { getDashboardStats } from '@/features/dashboard/actions/dashboard.actions';
import { StatsGrid } from '@/features/dashboard/components/StatsGrid';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const claims = await getClaims();

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground">Monitor real-time claim metrics and deadlines.</p>
      </div>

      <StatsGrid {...stats} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Latest Claims</h2>
        <ClaimsTable claims={claims} />
      </div>
    </div>
  );
}
