'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateClaimStatus } from '@/features/claims/actions/claims.actions';
import type { ClaimStatus } from '@/features/claims/constants';

type ClaimStatusSelectProps = {
  claimId: string;
  currentStatus: string; // Using string to be loose, but ideally matches ClaimStatus
};

// Italian labels for the status options
const STATUS_LABELS: Record<ClaimStatus, string> = {
  OPEN: 'Aperto',
  DOCS_COLLECTION: 'Documentazione in raccolta',
  NEGOTIATION: 'Negoziazione',
  CLOSED: 'Chiuso',
};

export const ClaimStatusSelect = ({
  claimId,
  currentStatus,
}: ClaimStatusSelectProps) => {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: ClaimStatus) => {
    startTransition(async () => {
      try {
        const result = await updateClaimStatus(claimId, newStatus);

        if (result.success) {
          toast.success('Status updated successfully');
        } else {
          toast.error(result.error || 'Failed to update status');
        }
      } catch {
        toast.error('An unexpected error occurred');
      }
    });
  };

  return (
    <Select
      defaultValue={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
