'use client';

import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteClaim } from '@/features/claims/actions/claims.actions';

type DeleteClaimButtonProps = {
  claimId: string;
};

export const DeleteClaimButton = ({ claimId }: DeleteClaimButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClaim(claimId);
      if (result.success) {
        toast.success('Sinistro eliminato');
        router.push('/dashboard/claims');
      } else {
        toast.error(result.error || 'Errore durante l\'eliminazione');
      }
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label="Elimina sinistro"
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sei sicuro?</DialogTitle>
          <DialogDescription>
            Questa azione è irreversibile. Il sinistro e tutti i documenti associati verranno eliminati permanentemente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">Annulla</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Elimina
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
