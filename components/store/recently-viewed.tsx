// components/store/recently-viewed.tsx
// Client component — horizontal scroll of recently viewed products from localStorage

"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/store/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductPublic } from "@/types";

export default function RecentlyViewed() {
  const [products, setProducts] = useState<ProductPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecentlyViewed() {
      try {
        const stored = localStorage.getItem("recently_viewed");
        if (!stored) {
          setLoading(false);
          return;
        }

        const slugs = JSON.parse(stored) as string[];
        if (!Array.isArray(slugs) || slugs.length === 0) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/products/batch-slugs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs }),
        });

        if (!res.ok) throw new Error("Failed to fetch recently viewed");
        const data = await res.json() as { products: ProductPublic[] };
        setProducts(data.products);
      } catch (error) {
        console.error("Failed to load recently viewed:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRecentlyViewed();
  }, []);

  if (loading) {
    return (
      <section className="flex flex-col gap-6 py-8 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground">Recently Viewed</h2>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-64 flex flex-col gap-2">
              <Skeleton className="aspect-[4/3] rounded-3xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-6 py-8 border-t border-border">
      <h2 className="text-2xl font-bold text-foreground">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-muted">
        {products.map((p) => (
          <div key={p.id} className="flex-shrink-0 w-64 sm:w-72 snap-start">
            <ProductCard
              id={p.id}
              slug={p.slug}
              name={p.name}
              price={p.price}
              compareAtPrice={p.compareAtPrice}
              primaryImage={p.images[0]?.url ?? null}
              category={p.category}
              isOnSale={p.isOnSale}
              isFeatured={p.isFeatured}
              stockQuantity={p.stockQuantity}
              createdAt={p.createdAt}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
