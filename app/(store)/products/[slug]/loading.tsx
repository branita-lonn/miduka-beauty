// app/(store)/products/[slug]/loading.tsx
// Skeleton for the product detail page

import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-[4/3] md:aspect-[3/4] w-full rounded-3xl" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6 pt-4">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-10 w-3/4 rounded-xl" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <div className="h-px bg-border my-2" />
          <div className="flex gap-3 mt-4">
            <Skeleton className="h-14 flex-1 rounded-4xl" />
            <Skeleton className="h-14 w-16 rounded-4xl" />
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
