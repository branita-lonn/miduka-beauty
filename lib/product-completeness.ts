// lib/product-completeness.ts
// Utility to compute product completeness score

import { ProductWithRelations } from "@/types";

export function computeCompleteness(product: ProductWithRelations): number {
  let score = 0;

  // Has at least one image: 20 points
  if (product.images && product.images.length > 0) {
    score += 20;
  }

  // Has at least 3 images: additional 10 points (total 30 if 3+ images)
  if (product.images && product.images.length >= 3) {
    score += 10;
  }

  // Has a description (non-empty, >50 chars): 20 points
  if (product.description && product.description.length > 50) {
    score += 20;
  }

  // Has a category assigned: 10 points
  if (product.categoryId) {
    score += 10;
  }

  // Has at least one variant OR stockQuantity > 0: 10 points
  if ((product.variants && product.variants.length > 0) || product.stockQuantity > 0) {
    score += 10;
  }

  // Has a price > 0: 10 points
  if (Number(product.price) > 0) {
    score += 10;
  }

  // Has at least one tag: 5 points
  if (product.tags && product.tags.length > 0) {
    score += 5;
  }

  // Dynamic attribute completeness: 15 points
  // If product has variants, all active variants must have at least one attribute value mapped.
  if (product.variants && product.variants.length > 0) {
    const activeVariants = product.variants.filter((v) => v.isActive);
    if (activeVariants.length > 0 && activeVariants.every((v) => v.attributes && v.attributes.length > 0)) {
      score += 15;
    } else if (activeVariants.length === 0) {
      score += 15;
    }
  } else {
    // If no variants, dynamic attribute criterion is trivially complete
    score += 15;
  }

  return Math.min(score, 100);
}
