'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const ProtectFallback = (props: { trigger: React.ReactNode }) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{props.trigger}</TooltipTrigger>
        <TooltipContent align="center">
          <p>Non hai i permessi per eseguire questa azione</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
