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


export interface AttributeDefinitionPublic {
  id: string;
  key: string;
  label: string;
  unit: string | null;
  inputType: "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN" | "COLOR";
  sortOrder: number;
  isFilterable: boolean;
  categoryId: string | null;
  allowedValues: string[]; // value strings sorted by allowedValue.sortOrder
}

export interface VariantAttributePublic {
  attributeDefinitionId: string;
  key: string;
  label: string;
  unit: string | null;
  inputType: "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN" | "COLOR";
  value: string;
}

export interface ProductVariantPublic {
  id: string;
  priceOverride: number | null;
  stockQuantity: number;
  sku: string | null;
  isActive: boolean;
  attributes: VariantAttributePublic[];
  /** Pre-computed human-readable label, e.g. "Silver / 128GB / 8GB RAM" */
  label: string;
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
  images: {
    id: string;
    url: string;
    altText?: string | null;
    blurDataUrl?: string | null;
    sortOrder: number;
    createdAt: string;
    variantIds: string[];
  }[];
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
    images: {
      include: {
        variantLinks: {
          include: { variant: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    },
    variants: {
      include: {
        attributes: {
          include: { attributeDefinition: true },
          orderBy: { attributeDefinition: { sortOrder: "asc" } },
        },
        imageLinks: {
          include: { image: true },
        },
      },
    },
    flashSale: true,
  },
});

export type ProductWithRelations = Prisma.ProductGetPayload<typeof productWithRelations> & {
  completenessScore?: number;
};

export type ProductWithRelationsSerialized = {
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
  lowStockThreshold: number;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string } | null;
  images: {
    id: string;
    url: string;
    altText: string | null;
    blurDataUrl: string | null;
    sortOrder: number;
    createdAt: string;
    variantIds: string[]; // IDs of linked variants (derived from variantLinks)
  }[];
  variants: {
    id: string;
    priceOverride: number | null;
    stockQuantity: number;
    lowStockThreshold: number;
    sku: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    attributes: VariantAttributePublic[];
    label: string; // pre-computed by serializeProduct()
  }[];
  flashSale: {
    id: string;
    salePrice: number;
    startTime: string;
    endTime: string;
  } | null;
  completenessScore?: number;
};

export interface VariantAttributeInput {
  attributeDefinitionId: string;
  value: string;
}

export interface VariantInput {
  id?: string;           // present when updating an existing variant
  priceOverride?: number | null;
  stockQuantity: number;
  sku?: string;
  isActive: boolean;
  attributes: VariantAttributeInput[];
}

export interface ProductImageInput {
  url: string;
  blurDataUrl?: string | null;
  altText?: string | null;
  sortOrder?: number;
  /**
   * On product UPDATE: array of real database variant IDs.
   * On product CREATE: use variantIndex instead (see below).
   */
  variantIds?: string[];
  /**
   * On product CREATE only: 0-based index into the variants[] array in the same request.
   * The API resolves this to the actual created variantId inside the transaction.
   * Use this field on creation; use variantIds on updates where real IDs exist.
   */
  variantIndex?: number;
}

// Ensure the form values type can be inferred or exported if needed
// This will be expanded when we create the Zod schema
export interface ProductFormValues {
  name: string;
  categoryId?: string | null;
  price: number;
  compareAtPrice?: number | null;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  description?: string;
  stockQuantity: number;
  images: ProductImageInput[];
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

// ─── HERO CAROUSEL ────────────────────────────────────────────────────────────

export interface HeroSlideData {
  id: string
  headline: string | null
  subheadline: string | null
  ctaText: string | null
  ctaLink: string | null
  desktopImageUrl: string
  mobileImageUrl: string
  desktopPublicId: string | null
  mobilePublicId: string | null
  sortOrder: number
  isActive: boolean
  overlayColor: string | null
  textAlign: string | null
  verticalAlign: string | null
  videoUrl: string | null
  videoPublicId: string | null
  duration: number | null
  createdAt: Date
  updatedAt: Date
}

export interface HeroSlideFormValues {
  headline: string
  subheadline: string
  ctaText: string
  ctaLink: string
  desktopImageUrl: string
  mobileImageUrl: string
  desktopPublicId: string
  mobilePublicId: string
  overlayColor: string
  textAlign: "left" | "center" | "right"
  verticalAlign: "top" | "center" | "bottom"
  videoUrl: string
  videoPublicId: string
  duration: number | null
  isActive: boolean
  sortOrder: number
}
