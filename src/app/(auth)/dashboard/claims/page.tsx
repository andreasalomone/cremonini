import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getClaims } from '@/features/claims/actions/claims.actions';
import { ClaimForm } from '@/features/claims/components/ClaimForm';
import { ClaimsTable } from '@/features/claims/components/ClaimsTable';

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

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              New Claim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Open New Claim</DialogTitle>
              <DialogDescription>
                Fill in the details below to open a new claim file.
              </DialogDescription>
            </DialogHeader>
            <ClaimForm />
          </DialogContent>
        </Dialog>
      </div>

      <ClaimsTable claims={claims} />
    </div>
  );
}
