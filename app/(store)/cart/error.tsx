// app/(store)/cart/error.tsx
// Error boundary for the cart page

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CartError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CartPage] Error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          We couldn&apos;t load your cart. Please try again.
        </p>
      </div>
      <div className="flex gap-3">
        <Button className="rounded-2xl" onClick={reset}>
          Try Again
        </Button>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-8 gap-1.5 px-2.5 rounded-2xl border border-border bg-background hover:bg-muted text-sm font-medium transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
