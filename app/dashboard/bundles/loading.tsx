// app/dashboard/bundles/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function BundlesLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-[400px] rounded-3xl" />
        <Skeleton className="lg:col-span-2 h-[400px] rounded-3xl" />
      </div>
    </div>
  );
}
