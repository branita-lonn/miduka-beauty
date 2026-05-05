// app/dashboard/hero/loading.tsx
// Skeleton loader for hero slide manager

import { Skeleton } from "@/components/ui/skeleton";

export default function HeroLoading() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      <Skeleton className="h-16 w-full rounded-3xl" />

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
