// components/store/product-bundle-callout.tsx
// Displays bundle deal suggestions on the product detail page

"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Plus, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BundleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: { url: string }[];
}

interface Bundle {
  id: string;
  name: string;
  discountPrice: number;
  products: BundleProduct[];
}

interface ProductBundleCalloutProps {
  bundles: Bundle[];
  currentProductId: string;
}

export function ProductBundleCallout({ bundles, currentProductId }: ProductBundleCalloutProps) {
  if (bundles.length === 0) return null;

  return (
    <div className="space-y-4 pt-6 border-t border-border/50">
      <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
        <Package className="h-4 w-4" />
        Bundle Deals
      </div>
      
      <div className="space-y-3">
        {bundles.map((bundle) => {
          // Find the other product in the bundle
          const otherProducts = bundle.products.filter(p => p.id !== currentProductId);
          if (otherProducts.length === 0) return null;

          const individualSum = bundle.products.reduce((sum, p) => sum + Number(p.price), 0);
          const savings = individualSum - Number(bundle.discountPrice);

          return (
            <div 
              key={bundle.id}
              className="group relative bg-primary/5 rounded-3xl p-4 border border-primary/10 hover:border-primary/20 transition-all"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {bundle.products.map((p, i) => (
                      <div key={p.id} className="relative h-12 w-12 rounded-2xl overflow-hidden border-2 border-background shadow-sm z-[1]">
                         {p.images[0]?.url ? (
                           <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                         ) : (
                           <div className="w-full h-full bg-muted flex items-center justify-center text-[10px]">No img</div>
                         )}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground line-clamp-1">{bundle.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Save {formatCurrency(savings)} when bought together
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-primary">
                      {formatCurrency(bundle.discountPrice)}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-through">
                      {formatCurrency(individualSum)}
                    </span>
                  </div>
                  
                  <Link href={`/products/${otherProducts[0].slug}`} className="text-xs font-semibold text-foreground hover:text-primary flex items-center gap-1">
                    View items <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
