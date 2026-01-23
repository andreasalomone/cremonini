'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
  readOnly?: boolean;
};

export const ClaimStatusSelect = ({
  claimId,
  currentStatus,
  readOnly = false,
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

  const currentLabel = CLAIM_STATUS_OPTIONS.find(opt => opt.value === currentStatus)?.label || currentStatus;

  // Read-only mode: show a static badge instead of interactive select
  if (readOnly) {
    return (
      <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium">
        {currentLabel}
      </Badge>
    );
  }

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
