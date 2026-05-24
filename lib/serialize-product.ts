// file: lib/serialize-product.ts
// purpose: Converts a Prisma ProductWithRelations (containing Decimal/Date objects)
//          into a JSON-safe ProductWithRelationsSerialized.
//          This is the single source of truth for this conversion — replace all
//          ad-hoc serialisation in page components and API routes with a call to
//          serializeProduct().
//
//          Call sites to update:
//            - app/api/dashboard/products/route.ts (GET + POST response)
//            - app/api/dashboard/products/[id]/route.ts (GET + PUT response)
//            - app/(store)/products/[slug]/page.tsx (server component)
//            - app/(store)/categories/[slug]/page.tsx (if products are serialised there)

import type {
  ProductWithRelations,
  ProductWithRelationsSerialized,
  VariantAttributePublic,
} from "@/types";
import { computeVariantLabel } from "@/lib/variant-label";

export function serializeProduct(
  product: ProductWithRelations
): ProductWithRelationsSerialized {
  return {
    id:               product.id,
    name:             product.name,
    slug:             product.slug,
    description:      product.description,
    price:            Number(product.price),
    compareAtPrice:   product.compareAtPrice ? Number(product.compareAtPrice) : null,
    tags:             product.tags,
    isActive:         product.isActive,
    isFeatured:       product.isFeatured,
    isOnSale:         product.isOnSale,
    stockQuantity:    product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    categoryId:       product.categoryId,
    createdAt:        product.createdAt.toISOString(),
    updatedAt:        product.updatedAt.toISOString(),
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
      : null,
    images: product.images.map((img) => ({
      id:          img.id,
      url:         img.url,
      altText:     img.altText,
      blurDataUrl: img.blurDataUrl,
      sortOrder:   img.sortOrder,
      createdAt:   img.createdAt.toISOString(),
      variantIds:  img.variantLinks.map((vl) => vl.variantId),
    })),
    variants: product.variants.map((v) => {
      const sortedRawAttrs = [...v.attributes].sort(
        (a, b) => (a.attributeDefinition.sortOrder ?? 0) - (b.attributeDefinition.sortOrder ?? 0)
      );
      const attrs: VariantAttributePublic[] = sortedRawAttrs.map((a) => ({
        attributeDefinitionId: a.attributeDefinitionId,
        key:       a.attributeDefinition.key,
        label:     a.attributeDefinition.label,
        unit:      a.attributeDefinition.unit,
        inputType: a.attributeDefinition.inputType,
        value:     a.value,
      }));
      return {
        id:                v.id,
        priceOverride:     v.priceOverride ? Number(v.priceOverride) : null,
        stockQuantity:     v.stockQuantity,
        lowStockThreshold: v.lowStockThreshold,
        sku:               v.sku,
        isActive:          v.isActive,
        createdAt:         v.createdAt.toISOString(),
        updatedAt:         v.updatedAt.toISOString(),
        attributes:        attrs,
        label:             computeVariantLabel(attrs),
      };
    }),
    productAttributes: product.productAttributes ? product.productAttributes.map((pa) => ({
      attributeDefinitionId: pa.attributeDefinitionId,
      key:       pa.attributeDefinition.key,
      label:     pa.attributeDefinition.label,
      unit:      pa.attributeDefinition.unit,
      inputType: pa.attributeDefinition.inputType,
      value:     pa.value,
    })) : [],
    flashSale: product.flashSale
      ? {
          id:        product.flashSale.id,
          salePrice: Number(product.flashSale.salePrice),
          startTime: product.flashSale.startTime.toISOString(),
          endTime:   product.flashSale.endTime.toISOString(),
        }
      : null,
    completenessScore: product.completenessScore,
  };
}
