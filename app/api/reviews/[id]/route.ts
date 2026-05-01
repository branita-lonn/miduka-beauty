// app/api/reviews/[id]/route.ts
// API route for managing individual reviews (edit/delete)

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations/review";
import { subDays, isBefore } from "date-fns";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return new NextResponse("Review not found", { status: 404 });
    }

    if (review.customerId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if within 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    if (isBefore(review.createdAt, thirtyDaysAgo)) {
      return new NextResponse("Review can only be edited within 30 days of creation", { status: 403 });
    }

    const body = await req.json();
    const validatedFields = reviewSchema.safeParse(body);

    if (!validatedFields.success) {
      return new NextResponse(validatedFields.error.message, { status: 400 });
    }

    const { rating, title, body: reviewBody, photos } = validatedFields.data;

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating,
        title,
        body: reviewBody,
        photos: photos || [],
      },
    });

    return NextResponse.json(updatedReview);
  } catch (error: unknown) {
    console.error("[REVIEW_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return new NextResponse("Review not found", { status: 404 });
    }

    if (review.customerId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.review.delete({
      where: { id },
    });

    return new NextResponse("Review deleted", { status: 200 });
  } catch (error: unknown) {
    console.error("[REVIEW_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
