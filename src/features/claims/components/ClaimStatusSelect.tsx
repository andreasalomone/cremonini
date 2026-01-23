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
import { CLAIM_STATUS_OPTIONS } from '@/features/claims/constants';

type ClaimStatusSelectProps = {
  claimId: string;
  currentStatus: string;
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
          toast.success('Stato aggiornato');
        } else {
          const errorMessage = 'error' in result ? (result.error as string) : 'Errore durante l\'aggiornamento';
          toast.error(errorMessage);
        }
      } catch {
        toast.error('Errore imprevisto');
      }
    });
  };

  return (
    <Select
      defaultValue={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Seleziona stato" />
      </SelectTrigger>
      <SelectContent>
        {CLAIM_STATUS_OPTIONS.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
