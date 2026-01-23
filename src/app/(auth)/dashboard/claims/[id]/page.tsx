import { auth } from '@clerk/nextjs/server';
import { ChevronLeft, History } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getClaimById, getDocumentUrl, updateClaimEconomics } from '@/features/claims/actions/claims.actions';
import { ClaimStatusSelect } from '@/features/claims/components/ClaimStatusSelect';
import { ClaimTimeline } from '@/features/claims/components/ClaimTimeline';
import { DocumentList } from '@/features/claims/components/DocumentList';
import { DocumentUploadDialog } from '@/features/claims/components/DocumentUploadDialog';
import { EconomicFields } from '@/features/claims/components/EconomicFields';
import { CLAIM_STATE_OPTIONS, CLAIM_TYPE_OPTIONS } from '@/features/claims/constants';
import { checkIsSuperAdmin } from '@/libs/auth-utils';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: {
    id: string;
  };
};

export default async function ClaimDetailPage({ params }: PageProps) {
  const { orgId } = await auth();
  const isSuperAdmin = checkIsSuperAdmin(orgId);
  const readOnly = !isSuperAdmin;

  const claim = await getClaimById(params.id);

  if (!claim) {
    notFound();
  }

  const typeLabel = CLAIM_TYPE_OPTIONS.find(opt => opt.value === claim.type)?.label || claim.type;
  const stateLabel = CLAIM_STATE_OPTIONS.find(opt => opt.value === claim.state)?.label || claim.state;

  return (
    <div className="flex flex-col gap-6">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/claims">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Sinistro
                {claim.id.slice(0, 8)}
              </h1>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                {stateLabel}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {typeLabel}
              {' '}
              • Creato il
              {new Date(claim.createdAt).toLocaleDateString('it-IT')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ClaimStatusSelect claimId={claim.id} currentStatus={claim.status} readOnly={readOnly} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* General Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informazioni Generali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Data Accadimento</span>
                  <p className="text-sm">{new Date(claim.eventDate).toLocaleDateString('it-IT')}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Luogo</span>
                  <p className="text-sm">{claim.location || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Numero Documento</span>
                  <p className="text-sm">{claim.documentNumber || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Vettore / Depositario</span>
                  <p className="text-sm">{claim.carrierName || '-'}</p>
                </div>
                {claim.hasThirdPartyResponsible && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium uppercase text-muted-foreground">Terzo Responsabile</span>
                    <p className="text-sm">{claim.thirdPartyName || '-'}</p>
                  </div>
                )}
                <div className="col-span-full space-y-1">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Descrizione</span>
                  <p className="text-sm leading-relaxed">{claim.description || 'Nessuna descrizione fornita.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Economic Data */}
          <EconomicFields
            claimId={claim.id}
            initialValues={{
              estimatedValue: claim.estimatedValue as string,
              verifiedDamage: claim.verifiedDamage as string,
              claimedAmount: claim.claimedAmount as string,
              recoveredAmount: claim.recoveredAmount as string,
              estimatedRecovery: claim.estimatedRecovery as string,
            }}
            onSave={updateClaimEconomics}
            readOnly={readOnly}
          />

          {/* Documents Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-primary">Documentazione</CardTitle>
              <DocumentUploadDialog claimId={claim.id} />
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={claim.documents || []}
                onDownload={getDocumentUrl}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (1/3) - Timeline */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="size-5 text-primary" />
                Timeline Attività
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ClaimTimeline activities={claim.activities || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
