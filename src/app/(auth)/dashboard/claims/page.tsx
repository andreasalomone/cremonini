import { getClaims } from '@/features/claims/actions/claims.actions';
import { ClaimsTable } from '@/features/claims/components/ClaimsTable';
import { NewClaimDialog } from '@/features/claims/components/NewClaimDialog';

// Prevent static pre-rendering - this page requires runtime database access
export const dynamic = 'force-dynamic';

export default async function ClaimsPage() {
  const claims = await getClaims();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Claims Management</h1>
          <p className="text-muted-foreground">
            View and manage all your claims in one place.
          </p>
        </div>

        <NewClaimDialog />
      </div>

      <ClaimsTable claims={claims} />
    </div>
  );
}
