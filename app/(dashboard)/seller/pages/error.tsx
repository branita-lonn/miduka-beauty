"use client";

import { Button } from "@/components/ui/button";

export default function PagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Pages</h1>
        <p className="text-muted-foreground">Edit your informational pages.</p>
      </div>
      <div className="p-6 border border-destructive/50 rounded-lg bg-destructive/10">
        <h2 className="text-lg font-medium text-destructive mb-2">Error loading pages</h2>
        <p className="text-sm text-muted-foreground mb-4">
          There was a problem loading the store pages editor.
        </p>
        <Button onClick={() => reset()} variant="outline">
          Try again
        </Button>
      </div>
    </div>
  );
}
