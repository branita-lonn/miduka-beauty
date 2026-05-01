// app/api/products/route.ts
// GET /api/products — public product search with filters, sort, and pagination

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ProductPublic, ProductsApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  best_selling: { createdAt: "desc" },  // placeholder until orders exist
  most_reviewed: { reviews: { _count: "desc" } },
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const sp = req.nextUrl.searchParams;

    const q = sp.get("q")?.trim() ?? "";
    const category = sp.get("category") ?? "";
    const minPrice = sp.get("minPrice") ? parseFloat(sp.get("minPrice")!) : undefined;
    const maxPrice = sp.get("maxPrice") ? parseFloat(sp.get("maxPrice")!) : undefined;
    const sizes = sp.get("size") ? sp.get("size")!.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const colours = sp.get("colour") ? sp.get("colour")!.split(",").map((c) => c.trim()).filter(Boolean) : [];
    const onSale = sp.get("onSale") === "true";
    const inStock = sp.get("inStock") === "true";
    const sort = sp.get("sort") ?? "newest";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const limit = Math.min(40, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      SORT_MAP[sort] ?? SORT_MAP.newest;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      }),
      ...(category && { category: { slug: category } }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && {
        price: minPrice !== undefined ? { gte: minPrice, lte: maxPrice } : { lte: maxPrice },
      }),
      ...(sizes.length > 0 && {
        variants: { some: { size: { in: sizes }, isActive: true } },
      }),
      ...(colours.length > 0 && {
        variants: { some: { colour: { in: colours }, isActive: true } },
      }),
      ...(onSale && { isOnSale: true }),
      ...(inStock && { stockQuantity: { gt: 0 } }),
    };

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { select: { id: true, url: true, altText: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              colour: true,
              size: true,
              material: true,
              priceOverride: true,
              stockQuantity: true,
              sku: true,
              isActive: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
    ]);

    const products: ProductPublic[] = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      tags: p.tags,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isOnSale: p.isOnSale,
      stockQuantity: p.stockQuantity,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      categoryId: p.categoryId,
      category: p.category,
      images: p.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder,
      })),
      variants: p.variants.map((v) => ({
        id: v.id,
        colour: v.colour,
        size: v.size,
        material: v.material,
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
        stockQuantity: v.stockQuantity,
        sku: v.sku,
        isActive: v.isActive,
      })),
      reviewCount: p.reviews.length,
      rating: p.reviews.length > 0 
        ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length 
        : 0,
    }));

    const response: ProductsApiResponse = {
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
