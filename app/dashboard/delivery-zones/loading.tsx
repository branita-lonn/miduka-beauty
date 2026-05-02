// app/dashboard/delivery-zones/loading.tsx
// Loading skeleton for the delivery zones management page.

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DeliveryZonesLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 rounded-full" />
          <Skeleton className="h-4 w-80 rounded-full" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Table skeleton */}
      <Card className="rounded-3xl">
        <CardHeader>
          <Skeleton className="h-5 w-36 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b border-border last:border-0"
            >
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-5 w-64 rounded-full flex-1" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
