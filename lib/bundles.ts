// lib/bundles.ts
// Utility functions for calculating bundle deals and discounts

import { prisma } from "@/lib/prisma";

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

/**
 * Calculates the total savings from bundle deals in a cart.
 * A bundle is applied when all its products are present in the cart.
 * The discount is (Sum of individual prices) - (Bundle discountPrice).
 */
export async function calculateBundleSavings(items: CartItem[]) {
  if (items.length < 2) return 0;

  // Fetch all active bundles
  const bundles = await prisma.bundle.findMany({
    include: {
      products: {
        select: {
          id: true,
          price: true,
        }
      }
    }
  });

  let totalSavings = 0;
  const productIdsInCart = new Set(items.map(item => item.productId));

  for (const bundle of bundles) {
    const bundleProductIds = bundle.products.map(p => p.id);
    
    // Check if all bundle products are in the cart
    const hasAllProducts = bundleProductIds.every(id => productIdsInCart.has(id));

    if (hasAllProducts) {
      // Calculate individual prices sum
      const individualPricesSum = bundle.products.reduce((sum, p) => sum + Number(p.price), 0);
      const bundlePrice = Number(bundle.discountPrice);
      
      const savings = individualPricesSum - bundlePrice;
      if (savings > 0) {
        totalSavings += savings;
      }
    }
  }

  return totalSavings;
}

/**
 * Finds bundles that include a specific product to show as suggestions.
 */
export async function getBundlesForProduct(productId: string) {
  return await prisma.bundle.findMany({
    where: {
      products: {
        some: {
          id: productId
        }
      }
    },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: {
            take: 1,
            orderBy: { sortOrder: 'asc' }
          }
        }
      }
    }
  });
}
