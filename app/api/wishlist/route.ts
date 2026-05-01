// app/api/wishlist/route.ts
// API route for managing customer wishlist

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { customerId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!wishlist) {
      return NextResponse.json([]);
    }

    // Flatten to return just the products
    const products = wishlist.items.map(item => ({
      ...item.product,
      wishlistItemId: item.id,
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error("[WISHLIST_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    // Ensure wishlist exists for the customer
    let wishlist = await prisma.wishlist.findUnique({
      where: { customerId: session.user.id },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { customerId: session.user.id },
      });
    }

    // Check if item is already in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    let isWishlisted = false;

    if (existingItem) {
      // Remove from wishlist
      await prisma.wishlistItem.delete({
        where: { id: existingItem.id },
      });
      isWishlisted = false;
    } else {
      // Add to wishlist
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });
      isWishlisted = true;
    }

    return NextResponse.json({ isWishlisted });
  } catch (error) {
    console.error("[WISHLIST_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
