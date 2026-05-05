// app/(store)/loading.tsx
// Skeleton for the homepage while server data loads

import { Skeleton } from "@/components/ui/skeleton";
import { HeroSkeleton } from "@/components/store/hero-skeleton";

export default function StoreLoading() {
  return (
    <div className="flex flex-col gap-12 pb-16">
      <HeroSkeleton />

      <div className="container mx-auto px-4 flex flex-col gap-12">
        {/* Product grid sections */}
        {[0, 1, 2].map((s) => (
          <section key={s} className="flex flex-col gap-4">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-[4/3] rounded-3xl" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
