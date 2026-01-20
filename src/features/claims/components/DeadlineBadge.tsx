'use client';

import { format, isBefore, subDays } from 'date-fns';
import { it } from 'date-fns/locale';
import React from 'react';

import { Badge } from '@/components/ui/badge';

type DeadlineBadgeProps = {
  date: Date | string | null;
};

export const DeadlineBadge = ({ date }: DeadlineBadgeProps) => {
  if (!date) {
    return <span className="text-muted-foreground">-</span>;
  }

  const deadline = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const warningThreshold = subDays(new Date(), -7); // 7 days from now

  const isExpired = isBefore(deadline, now);
  const isUrgent = isBefore(deadline, warningThreshold);

  if (isExpired) {
    return (
      <Badge variant="destructive" className="font-bold">
        SCADUTO
      </Badge>
    );
  }

  if (isUrgent) {
    return (
      <Badge variant="outline" className="border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100">
        URGENTE
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="font-normal text-muted-foreground">
      {format(deadline, 'dd/MM/yyyy', { locale: it })}
    </Badge>
  );
};
