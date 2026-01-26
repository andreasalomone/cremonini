'use client';

import { useRouter } from 'next/navigation';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LABELS } from '@/constants/Labels';
import type { PoaStatus } from '@/features/procura/actions/procura.actions';
import { PoaStatusBadge } from '@/features/procura/components/PoaStatusBadge';
import { GLOBAL_CREMONINI_ID } from '@/features/procura/constants';
import { calculateDeadlines } from '@/libs/deadline-logic';
import type { Claim } from '@/models/Schema';
import type { Serialized } from '@/utils/serialization';

import { CLAIM_TYPE_OPTIONS } from '../constants';
import { ClaimStatusSelect } from './ClaimStatusSelect';
import { DeadlineBadge } from './DeadlineBadge';

type ClaimsTableProps = {
  claims: Serialized<Claim>[];
  poaStatusMap?: Map<string, PoaStatus>;
  showPoaColumn?: boolean;
  readOnly?: boolean;
};

const ID_DISPLAY_LENGTH = 8;
const BASE_COLUMN_COUNT = 9;
const POA_COLUMN_COUNT = 10;

export const ClaimsTable = ({
  claims,
  poaStatusMap,
  showPoaColumn = false,
  readOnly = false,
}: ClaimsTableProps) => {
  const router = useRouter();

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{LABELS.CLAIMS.ID}</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>{LABELS.CLAIMS.TYPE}</TableHead>
              <TableHead>{LABELS.CLAIMS.STATE}</TableHead>
              <TableHead>{LABELS.CLAIMS.CARRIER}</TableHead>
              <TableHead>Valore</TableHead>
              <TableHead>Riserva</TableHead>
              <TableHead>Prescrizione</TableHead>
              {showPoaColumn && <TableHead>{LABELS.PROCURA.ORGANIZATION}</TableHead>}
              <TableHead>{LABELS.CLAIMS.STATUS}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={showPoaColumn ? POA_COLUMN_COUNT : BASE_COLUMN_COUNT} className="h-24 text-center">
                      {LABELS.COMMON.NO_DATA}
                    </TableCell>
                  </TableRow>
                )
              : (
                  claims.map((claim) => {
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

                    const handleKeyDown = (e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick();
                      }
                    };

                    return (
                      <TableRow
                        key={claim.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        onClick={handleRowClick}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                        role="link"
                        aria-label={`Visualizza dettagli sinistro ${claim.id.slice(0, ID_DISPLAY_LENGTH)}...`}
                      >
                        <TableCell className="font-medium">
                          {claim.id.slice(0, ID_DISPLAY_LENGTH)}
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
                            <PoaStatusBadge
                              status={
                                poaStatusMap?.get(claim.orgId)?.hasPoA
                                  ? poaStatusMap.get(claim.orgId)
                                  : poaStatusMap?.get(GLOBAL_CREMONINI_ID)
                              }
                            />
                          </TableCell>
                        )}
                        <TableCell onClick={e => e.stopPropagation()}>
                          <ClaimStatusSelect claimId={claim.id} currentStatus={claim.status} readOnly={readOnly} />
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
