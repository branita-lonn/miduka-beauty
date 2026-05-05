// app/dashboard/hero/error.tsx
// Error boundary for hero slide manager

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function HeroError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[HERO_MANAGER_ERROR]", error);
  }, [error]);

  return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
      <div className="bg-destructive/10 p-4 rounded-full">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground max-w-md">
          There was an error loading the hero carousel manager. Please try again or contact support if the issue persists.
        </p>
      </div>
      <Button 
        onClick={() => reset()} 
        variant="outline" 
        className="rounded-full gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
