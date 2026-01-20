'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ClaimStatusSelect } from './ClaimStatusSelect';

// Minimal type definition based on DB schema
type Claim = {
  id: string;
  status: string;
  type: string;
  eventDate: Date | string;
  carrierName: string | null;
  estimatedValue: string | null;
  orgId: string;
};

export const ClaimsTable = ({ claims }: { claims: Claim[] }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.length === 0
            ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No claims found.
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
                    <TableCell>{new Date(claim.eventDate).toLocaleDateString()}</TableCell>
                    <TableCell>{claim.type}</TableCell>
                    <TableCell>{claim.carrierName || '-'}</TableCell>
                    <TableCell>{claim.estimatedValue || '-'}</TableCell>
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
