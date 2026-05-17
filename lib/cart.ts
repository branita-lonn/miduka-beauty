// lib/cart.ts
// Server-side cart utilities: getOrCreateCart and mergeGuestCartOnLogin

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ─── TYPE ─────────────────────────────────────────────────────────────────────

const cartWithItems = Prisma.validator<Prisma.CartDefaultArgs>()({
  include: {
    items: {
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
            flashSale: true,
          },
        },
        variant: {
          include: {
            attributes: {
              include: { attributeDefinition: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    },
  },
});

export type CartWithItems = Prisma.CartGetPayload<typeof cartWithItems>;

import { computeVariantLabel } from "@/lib/variant-label";

export type CartItemVariantSerialized = {
  id: string;
  priceOverride: number | null;
  stockQuantity: number;
  sku: string | null;
  isActive: boolean;
  attributes: {
    attributeDefinitionId: string;
    key: string;
    label: string;
    unit: string | null;
    inputType: string;
    value: string;
  }[];
  label: string;
};

export type CartWithItemsSerialized = Omit<CartWithItems, "items"> & {
  items: (Omit<CartWithItems["items"][number], "variant" | "product"> & {
    product: Omit<CartWithItems["items"][number]["product"], "price" | "compareAtPrice" | "flashSale"> & {
      price: number;
      compareAtPrice: number | null;
      flashSale: {
        id: string;
        productId: string;
        salePrice: number;
        startTime: Date;
        endTime: Date;
        createdAt: Date;
      } | null;
    };
    variant: CartItemVariantSerialized | null;
  })[];
};

export function serializeCart(cart: CartWithItems): CartWithItemsSerialized {
  return {
    id: cart.id,
    customerId: cart.customerId,
    sessionId: cart.sessionId,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: cart.items.map((item) => {
      if (!item.variant) {
        return {
          id: item.id,
          cartId: item.cartId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          product: {
            ...item.product,
            price: Number(item.product.price),
            compareAtPrice: item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null,
            flashSale: item.product.flashSale ? {
              ...item.product.flashSale,
              salePrice: Number(item.product.flashSale.salePrice),
            } : null,
          },
          variant: null,
        };
      }

      const attrs = item.variant.attributes.map((a) => ({
        attributeDefinitionId: a.attributeDefinitionId,
        key: a.attributeDefinition.key,
        label: a.attributeDefinition.label,
        unit: a.attributeDefinition.unit,
        inputType: a.attributeDefinition.inputType,
        value: a.value,
      }));

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: {
          ...item.product,
          price: Number(item.product.price),
          compareAtPrice: item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null,
          flashSale: item.product.flashSale ? {
            ...item.product.flashSale,
            salePrice: Number(item.product.flashSale.salePrice),
          } : null,
        },
        variant: {
          id: item.variant.id,
          priceOverride: item.variant.priceOverride ? Number(item.variant.priceOverride) : null,
          stockQuantity: item.variant.stockQuantity,
          sku: item.variant.sku,
          isActive: item.variant.isActive,
          attributes: attrs,
          label: computeVariantLabel(attrs),
        },
      };
    }),
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Finds an existing cart by customerId (logged-in) or sessionId (guest),
 * or creates a new one. Returns the cart with all items populated.
 */
export async function getOrCreateCart(
  customerId?: string,
  sessionId?: string
): Promise<CartWithItems> {
  // Prefer looking up by customerId for logged-in users
  if (customerId) {
    const existing = await prisma.cart.findUnique({
      where: { customerId },
      ...cartWithItems,
    });
    if (existing) return existing;

    // Check if user actually exists (to prevent FK constraint errors with stale sessions)
    const userExists = await prisma.user.findUnique({ where: { id: customerId } });
    if (userExists) {
      return prisma.cart.create({
        data: { customerId },
        ...cartWithItems,
      });
    } else {
      // Ignore customerId if the user record no longer exists
      customerId = undefined;
    }
  }

  // Fall back to sessionId for guests
  if (sessionId) {
    const existing = await prisma.cart.findFirst({
      where: { sessionId },
      ...cartWithItems,
    });
    if (existing) return existing;

    return prisma.cart.create({
      data: { sessionId },
      ...cartWithItems,
    });
  }

  // No identifier — create an anonymous cart (sessionId assigned by caller)
  return prisma.cart.create({
    data: {},
    ...cartWithItems,
  });
}

/**
 * Called when a guest logs in. Merges guest cart items into the
 * customer's cart (summing quantities for identical product+variant combos),
 * then deletes the guest cart.
 */
export async function mergeGuestCartOnLogin(
  guestSessionId: string,
  customerId: string
): Promise<void> {
  const guestCart = await prisma.cart.findFirst({
    where: { sessionId: guestSessionId },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) return;

  const customerCart = await getOrCreateCart(customerId);

  for (const guestItem of guestCart.items) {
    const existingItem = customerCart.items.find(
      (i) =>
        i.productId === guestItem.productId &&
        i.variantId === guestItem.variantId
    );

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + guestItem.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: customerCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          quantity: guestItem.quantity,
        },
      });
    }
  }

  // Delete the guest cart (cascades to its items)
  await prisma.cart.delete({ where: { id: guestCart.id } });
}
