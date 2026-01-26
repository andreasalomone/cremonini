'use client';

import { BadgeInfo, CheckCircle2, FileUp, History, Info, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

import type { ClaimActivity } from '@/models/Schema';
import type { Serialized } from '@/utils/serialization';

type ClaimTimelineProps = {
  activities: Serialized<ClaimActivity>[];
};

const activityIcons: Record<string, ReactNode> = {
  CREATED: <History className="size-4 text-blue-500" />,
  STATUS_CHANGE: <CheckCircle2 className="size-4 text-green-500" />,
  DOC_UPLOAD: <FileUp className="size-4 text-purple-500" />,
  DOC_DELETE: <History className="size-4 text-red-500" />,
  INFO_UPDATE: <BadgeInfo className="size-4 text-orange-500" />,
  ECONOMICS_UPDATE: <TrendingUp className="size-4 text-emerald-500" />,
};

export const ClaimTimeline = ({ activities }: ClaimTimelineProps) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 text-muted-foreground">
        <Info className="mb-2 size-8 opacity-20" />
        <p className="text-sm">Nessuna attività registrata</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {activities.map(activity => (
        <div key={activity.id} className="relative flex items-center gap-6">
          {/* Timeline Dot/Icon */}
          <div className="z-10 flex size-10 items-center justify-center rounded-full border bg-background shadow-sm ring-4 ring-muted/10">
            {(activityIcons[activity.actionType] as ReactNode) || <History className="size-4 text-muted-foreground" />}
          </div>

          {/* Activity Content */}
          <div className="flex flex-1 flex-col justify-center gap-1">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-sm font-semibold text-foreground">
                {activity.description}
              </h4>
              <time className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(activity.createdAt).toLocaleString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>

            {/* Optional Metadata View */}
            {!!activity.metadata && typeof activity.metadata === 'object' && Object.keys(activity.metadata as object).length > 0 && (
              <div className="mt-1 rounded border bg-muted/30 p-2 text-[10px] leading-relaxed text-muted-foreground">
                <pre className="max-h-24 overflow-y-auto font-sans">
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
