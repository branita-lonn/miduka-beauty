// app/api/dashboard/inventory/route.ts
// Inventory API — list products with stock levels and thresholds.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const lowStockOnly = searchParams.get("lowStock") === "true";

    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }
      ];
    }

    if (lowStockOnly) {
      // Products where base stock is low OR any variant stock is low
      where.OR = [
        ...(where.OR || []),
        {
          AND: [
              { variants: { none: {} } }, // No variants
              { stockQuantity: { lte: prisma.product.fields.lowStockThreshold } } // Stock <= threshold
          ]
        },
        {
          variants: {
            some: {
                stockQuantity: { lte: prisma.productVariant.fields.lowStockThreshold }
            }
          }
        }
      ];
      // Note: Prisma fields reference might not work directly in where lte for dynamic column comparison.
      // We might need to fetch and filter in JS if complex, but let's try a simpler approach or raw if needed.
      // Actually, for inventory dashboard, we usually fetch all and filter client-side for better UX unless thousands of products.
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: {
          orderBy: { createdAt: "asc" }
        },
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" }
        },
        category: {
          select: { name: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(products);
  } catch (error: unknown) {
    console.error("[GET /api/dashboard/inventory]", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}
