import { auth } from '@clerk/nextjs/server';
import { ChevronLeft, History } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getClaimById, getDocumentUrl, updateClaimEconomics } from '@/features/claims/actions/claims.actions';
import { ClaimStatusSelect } from '@/features/claims/components/ClaimStatusSelect';
import { ClaimTimeline } from '@/features/claims/components/ClaimTimeline';
import { DocumentList } from '@/features/claims/components/DocumentList';
import { DocumentUploadDialog } from '@/features/claims/components/DocumentUploadDialog';
import { EconomicFields } from '@/features/claims/components/EconomicFields';
import { type ClaimViewModel, toClaimViewModel } from '@/features/claims/utils/claim-view-model';
import { checkIsSuperAdmin } from '@/libs/auth-utils';
import type { Claim } from '@/models/Schema';
import { serialize, type Serialized } from '@/utils/serialization';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------

export default async function ClaimDetailPage({ params }: PageProps) {
  const [resolvedParams, session] = await Promise.all([
    params,
    auth(),
  ]);

  const { id } = resolvedParams;
  const { orgId } = session;

  if (!orgId) {
    redirect('/sign-in');
  }

  const isSuperAdmin = checkIsSuperAdmin(orgId);
  const readOnly = !isSuperAdmin;

  const rawClaim = await getClaimById(id);

  if (!rawClaim) {
    notFound();
  }

  // Security: IDOR Protection (Defense in Depth)
  // SuperAdmins CAN view claims from other orgs, but regular users cannot.
  if (!isSuperAdmin && rawClaim.orgId !== orgId) {
    console.error(`[Security Alert] IDOR attempt blocked. User Org: ${orgId}, Claim Org: ${rawClaim.orgId}`);
    notFound();
  }

  const serializedClaim = serialize(rawClaim) as unknown as Serialized<Claim>;
  const claimModel = toClaimViewModel(serializedClaim);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <HeaderSection claim={claimModel} readOnly={readOnly} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <GeneralInfoCard claim={claimModel} />

          <EconomicFields
            claimId={claimModel.id}
            initialValues={claimModel.economics}
            onSave={updateClaimEconomics}
            readOnly={readOnly}
          />

          <DocumentsCard claim={claimModel} readOnly={readOnly} superAdminTargetOrgId={isSuperAdmin ? claimModel.orgId : undefined} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <TimelineCard activities={claimModel.activities} />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Sub-Components
// ----------------------------------------------------------------------

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
    <p className="text-sm">{value}</p>
  </div>
);

function HeaderSection({ claim, readOnly }: { claim: ClaimViewModel; readOnly: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/claims" aria-label="Back to claims">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {`Sinistro ${claim.shortId}`}
            </h1>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
              {claim.stateLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {`${claim.typeLabel} • Creato il ${claim.formattedCreatedAt}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ClaimStatusSelect
          claimId={claim.id}
          currentStatus={claim.status}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

function GeneralInfoCard({ claim }: { claim: ClaimViewModel }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Informazioni Generali</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <InfoField label="Data Accadimento" value={claim.formattedEventDate} />
          <InfoField label="Luogo" value={claim.location} />
          <InfoField label="Numero Documento" value={claim.documentNumber} />
          <InfoField label="Vettore / Depositario" value={claim.carrierName} />

          {claim.thirdPartyName && (
            <InfoField label="Terzo Responsabile" value={claim.thirdPartyName} />
          )}

          <div className="col-span-full space-y-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">Descrizione</span>
            <p className="text-sm leading-relaxed">{claim.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentsCard({ claim, readOnly, superAdminTargetOrgId }: { claim: ClaimViewModel; readOnly: boolean; superAdminTargetOrgId?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg text-primary">Documentazione</CardTitle>
        <DocumentUploadDialog claimId={claim.id} readOnly={readOnly} targetOrgId={superAdminTargetOrgId} />
      </CardHeader>
      <CardContent>
        <DocumentList
          documents={claim.documents}
          onDownload={getDocumentUrl}
        />
      </CardContent>
    </Card>
  );
}

function TimelineCard({ activities }: { activities: any[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="size-5 text-primary" />
          Timeline Attività
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ClaimTimeline activities={activities || []} />
      </CardContent>
    </Card>
  );
}
