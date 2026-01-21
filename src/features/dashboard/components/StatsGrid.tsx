'use client';

import { AlertCircle, Archive, Banknote, ClipboardList, ShieldAlert, TrendingUp } from 'lucide-react';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ECONOMICS } from '@/constants/Economics';
import { cn } from '@/utils/Helpers';

type StatsGridProps = {
  totalClaims: number;
  activeClaims: number;
  criticalClaims: number;
  totalValue: number;
  totalRecovered: number;
  aggregateDeductibleResidual: number;
  className?: string;
};

export const StatsGrid = ({
  totalClaims,
  activeClaims,
  criticalClaims,
  totalValue,
  totalRecovered,
  aggregateDeductibleResidual,
  className,
}: StatsGridProps) => {
  const isDeductibleLow = aggregateDeductibleResidual < (ECONOMICS.ANNUAL_AGGREGATE_DEDUCTIBLE * ECONOMICS.DEDUCTIBLE_LOW_THRESHOLD);

  const stats = [
    {
      title: 'Sinistri Totali',
      value: totalClaims,
      icon: Archive,
      description: 'Totale sinistri inseriti',
    },
    {
      title: 'Sinistri Aperti',
      value: activeClaims,
      icon: ClipboardList,
      description: 'Pratiche attualmente in gestione',
    },
    {
      title: 'Sinistri Critici',
      value: criticalClaims,
      icon: AlertCircle,
      description: 'In scadenza o scaduti',
      critical: criticalClaims > 0,
    },
    {
      title: 'Valore Totale',
      value: `€${totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      description: 'Stima economica sinistri aperti',
    },
    {
      title: 'Totale Recuperato',
      value: `€${totalRecovered.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      icon: Banknote,
      description: 'Importo recuperato ad oggi',
    },
    {
      title: 'Residuo Franchigia',
      value: `€${aggregateDeductibleResidual.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      icon: ShieldAlert,
      description: 'Franchigia aggregata rimanente',
      critical: isDeductibleLow,
    },
  ];

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
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
