'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PoaStatus } from '@/features/procura/actions/procura.actions';
import { PoaStatusBadge } from '@/features/procura/components/PoaStatusBadge';
import { calculateDeadlines } from '@/libs/deadline-logic';
import type { Claim } from '@/models/Schema';

import { useRouter } from 'next/navigation';

import { CLAIM_TYPE_OPTIONS } from '../constants';
import { ClaimStatusSelect } from './ClaimStatusSelect';
import { DeadlineBadge } from './DeadlineBadge';

type ClaimsTableProps = {
  claims: Claim[];
  poaStatusMap?: Map<string, PoaStatus>;
  showPoaColumn?: boolean;
};

export const ClaimsTable = ({
  claims,
  poaStatusMap,
  showPoaColumn = false,
}: ClaimsTableProps) => {
  const router = useRouter();

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ambito</TableHead>
              <TableHead>Vettore</TableHead>
              <TableHead>Valore</TableHead>
              <TableHead>Riserva</TableHead>
              <TableHead>Prescrizione</TableHead>
              {showPoaColumn && <TableHead>Procura</TableHead>}
              <TableHead>Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={showPoaColumn ? 10 : 9} className="h-24 text-center">
                      Nessun sinistro trovato.
                    </TableCell>
                  </TableRow>
                )
              : (
                  claims.map((claim: Claim) => {
                    const typeLabel = CLAIM_TYPE_OPTIONS.find(opt => opt.value === claim.type)?.label || claim.type;
                    const stateLabel = claim.state === 'INTERNATIONAL' ? 'Int.' : 'Naz.';

                    // We need to know if it's decadence for the badge
                    const { isDecadence } = calculateDeadlines({
                      eventDate: new Date(claim.eventDate),
                      type: claim.type,
                      state: claim.state,
                      hasGrossNegligence: claim.hasGrossNegligence ?? undefined,
                    });

                    const handleRowClick = () => {
                      router.push(`/dashboard/claims/${claim.id}`);
                    };

                    return (
                      <TableRow
                        key={claim.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={handleRowClick}
                      >
                        <TableCell className="font-medium">
                          {claim.id.slice(0, 8)}
                          ...
                        </TableCell>
                        <TableCell>{new Date(claim.eventDate).toLocaleDateString('it-IT')}</TableCell>
                        <TableCell className="max-w-[120px] truncate" title={typeLabel}>{typeLabel}</TableCell>
                        <TableCell>{stateLabel}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{claim.carrierName || '-'}</TableCell>
                        <TableCell>
                          {claim.estimatedValue
                            ? `€${Number(claim.estimatedValue).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <DeadlineBadge date={claim.reserveDeadline} />
                        </TableCell>
                        <TableCell>
                          <DeadlineBadge date={claim.prescriptionDeadline} isDecadence={isDecadence} />
                        </TableCell>
                        {showPoaColumn && (
                          <TableCell>
                            <PoaStatusBadge status={poaStatusMap?.get(claim.orgId)} />
                          </TableCell>
                        )}
                        <TableCell onClick={e => e.stopPropagation()}>
                          <ClaimStatusSelect claimId={claim.id} currentStatus={claim.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
