// app/(store)/products/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Heart, Share2, Copy } from "lucide-react";
import ProductDetailView from "@/components/store/product-detail-view";
import RecentlyViewed from "@/components/store/recently-viewed";
import ProductRecommendations from "@/components/store/product-recommendations";
import Script from "next/script";
import { ReviewsSection } from "@/components/store/reviews-section";
import { ProductWithRelationsSerialized } from "@/types";
import { auth } from "@/auth";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: `${product.name} | MiDuka`,
    description: product.description || `Buy ${product.name} at MiDuka.`,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images.map((img) => img.url),
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const session = await auth();
  
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { isActive: true },
        orderBy: [
          { colour: "asc" },
          { size: "asc" },
        ],
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Fetch review data for initial display
  const [avgRating, totalReviews, ratingGroups] = await Promise.all([
    prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
    }),
    prisma.review.count({
      where: { productId: product.id },
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { productId: product.id },
      _count: { id: true },
    }),
  ]);

  const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingGroups.forEach((group) => {
    ratingBreakdown[group.rating] = group._count.id;
  });

  // Simple eligibility: must be logged in. 
  // (In a real app, check if they bought the product)
  const isEligible = !!session?.user;

  // Pre-serialize for client component
  const serializedProduct: ProductWithRelationsSerialized = {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    variants: product.variants.map((v) => ({
      ...v,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
  };

  const priceNum = Number(product.price);
  const isOutOfStock = product.stockQuantity === 0 && (product.variants.length === 0 || product.variants.reduce((acc, v) => acc + v.stockQuantity, 0) === 0);

  // Build JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map(img => img.url),
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: "MiDuka",
    },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
      priceCurrency: "KES",
      price: priceNum,
      availability: isOutOfStock 
        ? "https://schema.org/OutOfStock" 
        : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-8 flex flex-col gap-16">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="text-sm text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-foreground">Store</Link>
          <span className="text-muted-foreground/50">›</span>
          {product.category ? (
            <>
              <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
                {product.category.name}
              </Link>
              <span className="text-muted-foreground/50">›</span>
            </>
          ) : null}
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        <ProductDetailView product={serializedProduct} />

        {/* Description & Specs Tab Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {product.description && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">About this product</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed opacity-80">{product.description}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="pt-4">
                <h3 className="text-sm font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link 
                      key={tag} 
                      href={`/search?q=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Specs or Info could go here */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-muted/30 border border-border/50">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Product Highlights</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Authentic Quality</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Fast Shipping across Kenya</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Secure Payments</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews" className="scroll-mt-20">
          <ReviewsSection 
            productId={product.id} 
            productSlug={product.slug}
            isEligible={isEligible}
            currentUserId={session?.user?.id}
            initialData={{
              averageRating: avgRating._avg.rating || 0,
              totalReviews: totalReviews,
              ratingBreakdown: ratingBreakdown
            }}
          />
        </div>

        {/* Recommendations */}
        <ProductRecommendations productSlug={product.slug} />
        
        {/* Recently Viewed */}
        <RecentlyViewed />
      </div>
    </>
  );
}
