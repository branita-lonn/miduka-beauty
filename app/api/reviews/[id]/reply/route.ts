// app/api/reviews/[id]/reply/route.ts
// API route for seller replies to reviews

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: reviewId } = await params;

    if (!session?.user?.id || session.user.role !== "STORE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { body: replyBody } = body;

    if (!replyBody || replyBody.trim().length === 0) {
      return new NextResponse("Reply body is required", { status: 400 });
    }

    if (replyBody.length > 1000) {
      return new NextResponse("Reply body must be at most 1000 characters", { status: 400 });
    }

    const reply = await prisma.reviewReply.upsert({
      where: { reviewId },
      update: {
        body: replyBody,
      },
      create: {
        reviewId,
        body: replyBody,
      },
    });

    return NextResponse.json(reply);
  } catch (error: unknown) {
    console.error("[REVIEW_REPLY_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: reviewId } = await params;

    if (!session?.user?.id || session.user.role !== "STORE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.reviewReply.delete({
      where: { reviewId },
    });

    return new NextResponse("Reply deleted", { status: 200 });
  } catch (error: unknown) {
    console.error("[REVIEW_REPLY_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
