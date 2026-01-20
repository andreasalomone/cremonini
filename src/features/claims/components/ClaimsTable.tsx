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
import type { Claim } from '@/models/Schema';

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
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Vettore</TableHead>
            <TableHead>Valore</TableHead>
            <TableHead>Scadenza</TableHead>
            {showPoaColumn && <TableHead>Procura</TableHead>}
            <TableHead>Stato</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.length === 0
            ? (
                <TableRow>
                  <TableCell colSpan={showPoaColumn ? 8 : 7} className="h-24 text-center">
                    Nessun sinistro trovato.
                  </TableCell>
                </TableRow>
              )
            : (
                claims.map(claim => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">
                      {claim.id.slice(0, 8)}
                      ...
                    </TableCell>
                    <TableCell>{new Date(claim.eventDate).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell>{claim.type}</TableCell>
                    <TableCell>{claim.carrierName || '-'}</TableCell>
                    <TableCell>
                      {claim.estimatedValue
                        ? `€${Number(claim.estimatedValue).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <DeadlineBadge date={claim.reserveDeadline} />
                    </TableCell>
                    {showPoaColumn && (
                      <TableCell>
                        <PoaStatusBadge status={poaStatusMap?.get(claim.orgId)} />
                      </TableCell>
                    )}
                    <TableCell>
                      <ClaimStatusSelect claimId={claim.id} currentStatus={claim.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
        </TableBody>
      </Table>
    </div>
  );
};
