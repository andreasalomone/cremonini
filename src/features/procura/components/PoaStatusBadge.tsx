import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PoaStatus } from '@/features/procura/actions/procura.actions';

type PoaStatusBadgeProps = {
  status: PoaStatus | undefined;
};

export const PoaStatusBadge = ({ status }: PoaStatusBadgeProps) => {
  if (!status || !status.hasPoA) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="destructive" className="gap-1">
              <XCircle className="size-3" />
              No Procura
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Nessuna procura caricata per questa società</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status.isExpired) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
              <AlertTriangle className="size-3" />
              Scaduta
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>La procura è scaduta</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const authorizations = [];
  if (status.saAuthorizedToAct) {
    authorizations.push('Agire');
  }
  if (status.saAuthorizedToCollect) {
    authorizations.push('Incassare');
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
            <CheckCircle className="size-3" />
            OK
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Procura valida
            {authorizations.length > 0 && ` • S&A autorizzata: ${authorizations.join(', ')}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
