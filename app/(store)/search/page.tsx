// app/(store)/search/page.tsx
// Search results page — reads ?q= and renders ProductGrid

import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import ProductGrid from "@/components/store/product-grid";
import ProductSort from "@/components/store/product-sort";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  return {
    title: q ? `"${q}" — Search Results | MiDuka` : "Search | MiDuka",
    description: q
      ? `Search results for "${q}" at MiDuka.`
      : "Search for products at MiDuka.",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  return (
    <div className="container mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {q ? (
            <>
              Results for{" "}
              <span className="text-primary">&ldquo;{q}&rdquo;</span>
            </>
          ) : (
            "Search Products"
          )}
        </h1>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-end gap-3">
        <Suspense fallback={<Skeleton className="h-9 w-44 rounded-2xl" />}>
          <ProductSort />
        </Suspense>
      </div>

      {/* Grid */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[4/3] rounded-3xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            ))}
          </div>
        }
      >
        <ProductGrid defaultQ={q} />
      </Suspense>

      {/* No-results suggestion */}
      {q && (
        <div className="flex flex-col items-center gap-3 py-6 text-center border-t border-border">
          <Search className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Not finding what you&apos;re looking for?
          </p>
          <Link 
            href="/categories" 
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}
          >
            Browse All Categories
          </Link>
        </div>
      )}
    </div>
  );
}
