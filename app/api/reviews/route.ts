// app/api/reviews/route.ts
// API route for submitting product reviews

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations/review";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedFields = reviewSchema.safeParse(body);

    if (!validatedFields.success) {
      return new NextResponse(validatedFields.error.message, { status: 400 });
    }

    const { productId, rating, title, body: reviewBody, photos } = validatedFields.data;

    // Check for duplicate review
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_customerId: {
          productId,
          customerId: session.user.id,
        },
      },
    });

    if (existingReview) {
      return new NextResponse("You have already reviewed this product", { status: 409 });
    }

    // Purchase verification: Order with status DELIVERED containing this product
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        customerId: session.user.id,
        status: "DELIVERED",
        items: {
          some: {
            productId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!deliveredOrder) {
      return new NextResponse("You can only review products you have purchased and received.", { status: 403 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerId: session.user.id,
        rating,
        title,
        body: reviewBody,
        photos: photos || [],
        isVerifiedPurchase: true,
        orderId: deliveredOrder.id,
      },
      include: {
        customer: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error: unknown) {
    console.error("[REVIEWS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
