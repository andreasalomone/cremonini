import { AlertCircle, Archive, ClipboardList, TrendingUp } from 'lucide-react';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type StatsGridProps = {
  totalClaims: number;
  activeClaims: number;
  criticalClaims: number;
  totalValue: number;
};

export const StatsGrid = ({
  totalClaims,
  activeClaims,
  criticalClaims,
  totalValue,
}: StatsGridProps) => {
  const stats = [
    {
      title: 'Total Claims',
      value: totalClaims,
      icon: Archive,
      description: 'Total claims submitted',
    },
    {
      title: 'Active Claims',
      value: activeClaims,
      icon: ClipboardList,
      description: 'Claims currently open',
    },
    {
      title: 'Critical Claims',
      value: criticalClaims,
      icon: AlertCircle,
      description: 'Near-deadline or expired',
      critical: criticalClaims > 0,
    },
    {
      title: 'Total Value',
      value: `€${totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      description: 'Estimated value of open claims',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => (
        <Card
          key={stat.title}
          className={stat.critical ? 'border-destructive shadow-sm shadow-destructive/20' : ''}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon
              className={`size-4 ${stat.critical ? 'text-destructive' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.critical ? 'text-destructive' : ''}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
