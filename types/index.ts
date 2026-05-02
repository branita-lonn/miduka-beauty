// types/index.ts
// Shared TypeScript interfaces for MiDuka

import { Prisma } from "@prisma/client";

// ─── Storefront / Public API Types ───────────────────────────────────────────

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
}

export interface StoreSettingsData {
  id: string;
  storeName: string;
  storeTagline: string | null;
  logoUrl: string | null;
  logoBlurDataUrl: string | null;
  accentColor: string;
  socialLinks: SocialLinks | null;
  returnPolicy: string | null;
  whatsappNumber: string | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  heroImageUrl: string | null;
  heroBlurDataUrl: string | null;
  heroCtaText: string | null;
  heroCtaLink: string | null;
}


export interface ProductVariantPublic {
  id: string;
  colour: string | null;
  size: string | null;
  material: string | null;
  priceOverride: number | null;
  stockQuantity: number;
  sku: string | null;
  isActive: boolean;
}

export interface ProductPublic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  images: { id: string; url: string; blurDataUrl?: string | null; altText?: string | null; colour?: string | null }[];
  variants: ProductVariantPublic[];
  rating: number;
  reviewCount: number;
  flashSale?: FlashSalePublic | null;
}

export interface FlashSalePublic {
  id: string;
  salePrice: number;
  startTime: string | Date;
  endTime: string | Date;
}

export interface ProductsApiResponse {
  products: ProductPublic[];
  total: number;
  pages: number;
  currentPage: number;
  expandedFrom?: string | null;
}

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  primaryImage?: string | null;
  blurDataUrl?: string | null;
  category?: { name: string; slug: string } | null;
  isOnSale?: boolean;
  isFeatured?: boolean;
  stockQuantity?: number;
  createdAt: string | Date;
  rating?: number;
  reviewCount?: number;
  priority?: boolean;
  flashSale?: FlashSalePublic | null;
}


// Define the exact payload shapes based on Prisma includes
export const categoryWithRelations = Prisma.validator<Prisma.CategoryDefaultArgs>()({
  include: {
    parent: true,
    children: true,
    _count: {
      select: { products: true },
    },
  },
});

export type CategoryWithRelations = Prisma.CategoryGetPayload<typeof categoryWithRelations>;

export const productWithRelations = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    category: true,
    images: true,
    variants: true,
    flashSale: true,
  },
});

export type ProductWithRelations = Prisma.ProductGetPayload<typeof productWithRelations> & {
  completenessScore?: number;
};

export type ProductWithRelationsSerialized = Omit<ProductWithRelations, "price" | "compareAtPrice" | "variants" | "createdAt" | "updatedAt" | "images" | "flashSale"> & {
  price: number;
  compareAtPrice: number | null;
  createdAt: string;
  updatedAt: string;
  images: (Omit<ProductWithRelations["images"][number], "createdAt"> & {
    createdAt: string;
  })[];
  variants: (Omit<ProductWithRelations["variants"][number], "priceOverride" | "createdAt" | "updatedAt"> & {
    priceOverride: number | null;
    createdAt: string;
    updatedAt: string;
  })[];
  flashSale: (Omit<Exclude<ProductWithRelations["flashSale"], null>, "salePrice" | "startTime" | "endTime"> & {
    salePrice: number;
    startTime: string;
    endTime: string;
  }) | null;
};

export interface VariantInput {
  id?: string;
  colour?: string;
  size?: string;
  material?: string;
  priceOverride?: number;
  stockQuantity: number;
  sku?: string;
  isActive: boolean;
}

// Ensure the form values type can be inferred or exported if needed
// This will be expanded when we create the Zod schema
export interface ProductFormValues {
  name: string;
  categoryId?: string;
  price: number;
  compareAtPrice?: number;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  description?: string;
  stockQuantity: number;
  images: string[];
  variants: VariantInput[];
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export interface ReviewWithRelations {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  photos: string[];
  isVerifiedPurchase: boolean;
  productId: string;
  customerId: string;
  orderId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  customer: {
    name: string | null;
    image: string | null;
  };
  reply: {
    id: string;
    body: string;
    createdAt: Date | string;
  } | null;
  _count?: {
    votes: number;
  };
}

export interface ReviewSummaryData {
  reviews: ReviewWithRelations[];
  total: number;
  averageRating: number;
  ratingBreakdown: Record<number, number>;
}
