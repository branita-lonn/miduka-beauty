// app/api/products/[slug]/reviews/route.ts
// API route for fetching reviews for a specific product

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    let orderBy: any = { createdAt: "desc" };

    if (sort === "highest") {
      orderBy = { rating: "desc" };
    } else if (sort === "lowest") {
      orderBy = { rating: "asc" };
    } else if (sort === "helpful") {
      orderBy = {
        votes: {
          _count: "desc",
        },
      };
    }

    const [reviews, total, ratingCounts] = await Promise.all([
      prisma.review.findMany({
        where: { productId: product.id },
        include: {
          customer: {
            select: {
              name: true,
              image: true,
            },
          },
          reply: true,
          _count: {
            select: {
              votes: {
                where: { isHelpful: true },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: { productId: product.id },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { productId: product.id },
        _count: {
          rating: true,
        },
      }),
    ]);

    // Format rating breakdown
    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatingPoints = 0;
    
    ratingCounts.forEach((group) => {
      ratingBreakdown[group.rating] = group._count.rating;
      totalRatingPoints += group.rating * group._count.rating;
    });

    const averageRating = total > 0 ? totalRatingPoints / total : 0;

    return NextResponse.json({
      reviews,
      total,
      averageRating,
      ratingBreakdown,
    });
  } catch (error: unknown) {
    console.error("[PRODUCT_REVIEWS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
