import { AlertCircle, Archive, Banknote, ClipboardList, ShieldAlert, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ECONOMICS } from '@/constants/Economics';

type StatsGridProps = {
  totalClaims: number;
  activeClaims: number;
  criticalClaims: number;
  totalValue: number;
  totalRecovered: number;
  aggregateDeductibleResidual: number;
};

export const StatsGrid = ({
  totalClaims,
  activeClaims,
  criticalClaims,
  totalValue,
  totalRecovered,
  aggregateDeductibleResidual,
}: StatsGridProps) => {
  const t = useTranslations('DashboardStats');
  const isDeductibleLow = aggregateDeductibleResidual < (ECONOMICS.ANNUAL_AGGREGATE_DEDUCTIBLE * ECONOMICS.DEDUCTIBLE_LOW_THRESHOLD);

  const stats = [
    {
      title: t('total_claims'),
      value: totalClaims,
      icon: Archive,
      description: t('total_claims_desc'),
    },
    {
      title: t('active_claims'),
      value: activeClaims,
      icon: ClipboardList,
      description: t('active_claims_desc'),
    },
    {
      title: t('critical_claims'),
      value: criticalClaims,
      icon: AlertCircle,
      description: t('critical_claims_desc'),
      critical: criticalClaims > 0,
    },
    {
      title: t('total_value'),
      value: `€${totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      description: t('total_value_desc'),
    },
    {
      title: t('total_recovered'),
      value: `€${totalRecovered.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      icon: Banknote,
      description: t('total_recovered_desc'),
    },
    {
      title: t('residual_deductible'),
      value: `€${aggregateDeductibleResidual.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      icon: ShieldAlert,
      description: t('residual_deductible_desc'),
      critical: isDeductibleLow,
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
