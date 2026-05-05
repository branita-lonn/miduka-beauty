// components/store/hero-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function HeroSkeleton() {
  return (
    <div className="mx-4 md:mx-8 mt-4 relative overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[16/6]">
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-20 space-y-4">
        <Skeleton className="h-10 md:h-16 w-3/4 rounded-2xl" />
        <Skeleton className="h-4 md:h-6 w-1/2 rounded-xl" />
        <Skeleton className="h-12 w-32 rounded-full pt-4" />
      </div>
    </div>
  );
}
