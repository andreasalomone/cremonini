import { Banknote, CheckCircle2, Clock, PieChart } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type RecoveryStatsData = {
  fullRecovery: { count: number; estimated: number; recovered: number };
  partialRecovery: { count: number; estimated: number; recovered: number };
  noRecovery: { count: number; estimated: number; recovered: number };
  pending: { count: number; estimated: number; recovered: number };
};

export const RecoveryStatsCards = ({ data }: { data: RecoveryStatsData }) => {
  const totalRecovered = data.fullRecovery.recovered + data.partialRecovery.recovered;
  const totalEstimated = data.fullRecovery.estimated + data.partialRecovery.estimated + data.noRecovery.estimated + data.pending.estimated;
  const averageRecoveryRate = totalEstimated > 0 ? (totalRecovered / totalEstimated) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totale Recuperato</CardTitle>
          <Banknote className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            €
            {totalRecovered.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Su un valore stimato di €
            {totalEstimated.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ratio di Recupero</CardTitle>
          <PieChart className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageRecoveryRate.toFixed(1)}
            %
          </div>
          <p className="text-xs text-muted-foreground">Media su tutte le pratiche chiuse</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recuperi Completi</CardTitle>
          <CheckCircle2 className="size-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.fullRecovery.count}</div>
          <p className="text-xs text-muted-foreground">Pratiche chiuse al 100%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Lavorazione</CardTitle>
          <Clock className="size-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.pending.count}</div>
          <p className="text-xs text-muted-foreground">Pratiche non ancora concluse</p>
        </CardContent>
      </Card>
    </div>
  );
};
