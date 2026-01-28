'use client';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LABELS } from '@/constants/Labels';
import { cn } from '@/utils/Helpers';

type ClaimsOverviewProps = {
  open: number;
  total: number;
  className?: string;
};

export const ClaimsOverview = ({ open, total, className }: ClaimsOverviewProps) => {
  const closed = total - open;
  const data = [
    { name: LABELS.CLAIMS.OPEN, value: open, color: 'hsl(var(--info))' },
    { name: LABELS.CLAIMS.CLOSED, value: closed, color: 'hsl(var(--muted))' },
  ];

  const openPercentage = total > 0 ? (open / total) * 100 : 0;

  return (
    <Card className={cn('col-span-full lg:col-span-3', className)}>
      <CardHeader>
        <CardTitle className="text-base font-medium">{LABELS.CLAIMS.LIFECYCLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
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
                  backgroundColor: 'hsl(var(--background))',
                  borderRadius: 'var(--radius)',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-info" />
              <span className="text-muted-foreground">{LABELS.CLAIMS.OPEN_CLAIMS}</span>
            </div>
            <span className="font-bold">{open}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-muted" />
              <span className="text-muted-foreground">{LABELS.CLAIMS.CLOSED_CLAIMS}</span>
            </div>
            <span className="font-bold">{closed}</span>
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            {openPercentage.toFixed(0)}
            %
            {' '}
            {LABELS.CLAIMS.ACTIVE_PERCENTAGE}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
