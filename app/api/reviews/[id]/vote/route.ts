// app/api/reviews/[id]/vote/route.ts
// API route for voting on reviews (helpful/not helpful)

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

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { isHelpful } = body;

    if (typeof isHelpful !== "boolean") {
      return new NextResponse("isHelpful must be a boolean", { status: 400 });
    }

    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        reviewId_customerId: {
          reviewId,
          customerId: session.user.id,
        },
      },
    });

    if (existingVote) {
      if (existingVote.isHelpful === isHelpful) {
        // Remove the vote if it's the same
        await prisma.reviewVote.delete({
          where: {
            id: existingVote.id,
          },
        });
      } else {
        // Update the vote if it's different
        await prisma.reviewVote.update({
          where: {
            id: existingVote.id,
          },
          data: {
            isHelpful,
          },
        });
      }
    } else {
      // Create new vote
      await prisma.reviewVote.create({
        data: {
          reviewId,
          customerId: session.user.id,
          isHelpful,
        },
      });
    }

    // Get updated helpful count
    const helpfulCount = await prisma.reviewVote.count({
      where: {
        reviewId,
        isHelpful: true,
      },
    });

    return NextResponse.json({ helpfulCount });
  } catch (error: unknown) {
    console.error("[REVIEW_VOTE_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
