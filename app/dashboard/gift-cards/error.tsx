// app/dashboard/gift-cards/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GiftCardsDashboardError({
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
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Gift cards unavailable</h2>
        <p className="text-muted-foreground max-w-md">
          We encountered an issue loading the gift card management system. Please try again later.
        </p>
      </div>
      <Button onClick={() => reset()} variant="outline" className="rounded-full gap-2 px-8">
        <RotateCcw className="h-4 w-4" />
        Reload
      </Button>
    </div>
  );
}
