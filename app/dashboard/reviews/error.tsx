// app/dashboard/reviews/error.tsx
// Error boundary for dashboard reviews page

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function DashboardReviewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 space-y-4 text-center">
      <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        We encountered an error while loading the reviews dashboard. Please try again or contact support if the issue persists.
      </p>
      <div className="flex items-center gap-3 pt-4">
        <Button onClick={() => reset()} className="rounded-2xl gap-2">
          <RefreshCcw className="h-4 w-4" />
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = "/dashboard"} className="rounded-2xl">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
