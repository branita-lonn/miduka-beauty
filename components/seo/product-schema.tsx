// file: components/seo/product-schema.tsx
// purpose: Renders Product JSON-LD structured data for SEO

export interface ProductSchemaProps {
  product: {
    name: string;
    description: string | null;
    slug: string;
    price: number;
    images: { url: string }[];
    category?: { name: string } | null;
    stockQuantity: number;
    variants?: { stockQuantity: number }[];
  };
  storeName?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export function ProductSchema({ product, storeName = "MiDuka", aggregateRating }: ProductSchemaProps) {
  const isOutOfStock = product.stockQuantity === 0 && 
    (!product.variants || product.variants.length === 0 || product.variants.reduce((acc, v) => acc + v.stockQuantity, 0) === 0);

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images.map(img => img.url),
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: storeName,
    },
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/products/${product.slug}`,
      priceCurrency: "KES",
      price: product.price,
      availability: isOutOfStock 
        ? "https://schema.org/OutOfStock" 
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: storeName,
      }
    },
  };

  if (aggregateRating && aggregateRating.reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue.toFixed(1),
      reviewCount: aggregateRating.reviewCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
