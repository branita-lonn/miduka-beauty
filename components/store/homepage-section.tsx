// components/store/homepage-section.tsx
// Reusable homepage section with title, "View all" link, and product grid/scroll row

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/store/product-card";
import { ProductWithRelations } from "@/types";

interface HomepageSectionProps {
  title: string;
  products: ProductWithRelations[];
  viewAllHref: string;
}

export default function HomepageSection({ 
  title, 
  products, 
  viewAllHref 
}: HomepageSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <Link 
          href={viewAllHref}
          className="group flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition-all"
        >
          View all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Horizontal scroll on mobile, 4-column grid on desktop */}
      <div className="relative">
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 snap-x">
          {products.map((product) => (
            <div key={product.id} className="min-w-[260px] md:min-w-0 snap-start">
              <ProductCard
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={Number(product.price)}
                compareAtPrice={product.compareAtPrice ? Number(product.compareAtPrice) : undefined}
                primaryImage={product.images?.[0]?.url}
                isOnSale={product.isOnSale}
                stockQuantity={product.stockQuantity}
                createdAt={product.createdAt}
                flashSale={product.flashSale ? {
                  ...product.flashSale,
                  salePrice: Number(product.flashSale.salePrice)
                } : undefined}
                // Assume these are available or default to 0
                rating={0} 
                reviewCount={0}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
