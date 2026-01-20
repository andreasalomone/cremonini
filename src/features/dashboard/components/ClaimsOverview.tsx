'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ClaimsOverviewProps = {
  open: number;
  total: number;
};

export const ClaimsOverview = ({ open, total }: ClaimsOverviewProps) => {
  const closed = total - open;
  const openPercentage = total > 0 ? (open / total) * 100 : 0;

  return (
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base font-medium">Claims Lifecycle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Open Claims</span>
            </div>
            <span className="font-bold">{open}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-slate-200" />
              <span className="text-muted-foreground">Closed Claims</span>
            </div>
            <span className="font-bold">{closed}</span>
          </div>

          {/* Simple Progress Bar */}
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${openPercentage}%` }}
            />
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            {openPercentage.toFixed(0)}
            % of total claims are currently active.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
