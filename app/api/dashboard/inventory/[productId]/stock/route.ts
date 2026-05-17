// app/api/dashboard/inventory/[productId]/stock/route.ts
// API route to update stock quantities and thresholds for a product or its variants.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { sendBackInStockNotifications } from "@/lib/stock-alert-mailer";
import { computeVariantLabel } from "@/lib/variant-label";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;
    const body = await req.json();
    const { variantId, stockQuantity, lowStockThreshold } = body;

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            attributes: {
              include: { attributeDefinition: true },
              orderBy: { attributeDefinition: { sortOrder: "asc" } },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let previousStock = 0;
    let newStock = stockQuantity;
    let updatedVariantData = null;

    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

      previousStock = variant.stockQuantity;

      const updated = await prisma.productVariant.update({
        where: { id: variantId },
        data: {
          stockQuantity: stockQuantity !== undefined ? stockQuantity : undefined,
          lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : undefined
        },
        include: {
          attributes: {
            include: { attributeDefinition: true },
            orderBy: { attributeDefinition: { sortOrder: "asc" } },
          },
        },
      });

      const attrs = updated.attributes.map((a) => ({
        attributeDefinitionId: a.attributeDefinitionId,
        key: a.attributeDefinition.key,
        label: a.attributeDefinition.label,
        unit: a.attributeDefinition.unit,
        inputType: a.attributeDefinition.inputType,
        value: a.value,
      }));

      updatedVariantData = {
        id: updated.id,
        stockQuantity: updated.stockQuantity,
        lowStockThreshold: updated.lowStockThreshold,
        sku: updated.sku,
        isActive: updated.isActive,
        attributes: attrs,
        label: computeVariantLabel(attrs),
      };
    } else {
      previousStock = product.stockQuantity;

      await prisma.product.update({
        where: { id: productId },
        data: {
          stockQuantity: stockQuantity !== undefined ? stockQuantity : undefined,
          lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : undefined
        }
      });
    }

    // Trigger notifications if stock went from 0 to >0
    if (previousStock === 0 && newStock > 0) {
      // Fire and forget
      sendBackInStockNotifications(productId, variantId);
    }

    return NextResponse.json({
      success: true,
      ...(updatedVariantData && { variant: updatedVariantData }),
    });
  } catch (error: unknown) {
    console.error("[PATCH /api/dashboard/inventory/[productId]/stock]", error);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}
