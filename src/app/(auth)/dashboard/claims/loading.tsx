import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <Skeleton className="h-10 w-[150px] rounded-lg" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="border-b border-border/50 bg-muted/30 p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[120px]" />
          </div>
        </div>
        <div className="space-y-4 p-4">
          {['s1', 's2', 's3', 's4', 's5'].map(id => (
            <div key={id} className="flex items-center gap-4 border-b border-border/20 py-2 last:border-0">
              <Skeleton className="size-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
