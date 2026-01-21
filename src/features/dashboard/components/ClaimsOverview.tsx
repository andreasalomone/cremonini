'use client';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/Helpers';

type ClaimsOverviewProps = {
  open: number;
  total: number;
  className?: string;
};

export const ClaimsOverview = ({ open, total, className }: ClaimsOverviewProps) => {
  const closed = total - open;
  const data = [
    { name: 'Open', value: open, color: '#3b82f6' }, // blue-500
    { name: 'Closed', value: closed, color: '#e2e8f0' }, // slate-200
  ];

  const openPercentage = total > 0 ? (open / total) * 100 : 0;

  return (
    <Card className={cn('col-span-full lg:col-span-3', className)}>
      <CardHeader>
        <CardTitle className="text-base font-medium">Claims Lifecycle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-2">
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

          <div className="pt-2 text-xs text-muted-foreground">
            {openPercentage.toFixed(0)}
            % of total claims are currently active.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
