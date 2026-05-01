// app/(store)/cart/loading.tsx
// Skeleton loader for the cart page

import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 py-4 border-b border-border last:border-0">
              <Skeleton className="h-24 w-24 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-4 w-1/5" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-8 w-24 rounded-2xl" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-px w-full" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
