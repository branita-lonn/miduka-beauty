// app/(store)/products/[slug]/error.tsx
// Error boundary for the product detail page

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProductDetailError({
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
    <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-4 text-center">
      <h2 className="text-2xl font-bold">Failed to load product</h2>
      <p className="text-muted-foreground">We couldn&apos;t load the details for this product.</p>
      <div className="flex gap-3 mt-4">
        <Button onClick={reset} className="rounded-full px-6">Retry</Button>
        <Link href="/categories" className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}>
          Browse Products
        </Link>
      </div>
    </div>
  );
}
