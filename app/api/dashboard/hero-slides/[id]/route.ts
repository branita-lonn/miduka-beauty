// app/api/dashboard/hero-slides/[id]/route.ts
// Single-slide update and delete — STORE_OWNER only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import * as z from "zod";

const updateSlideSchema = z.object({
  headline: z.string().max(120).optional().nullable(),
  subheadline: z.string().max(200).optional().nullable(),
  ctaText: z.string().max(50).optional().nullable(),
  ctaLink: z.string().max(500).optional().nullable(),
  desktopImageUrl: z.string().url().optional(),
  mobileImageUrl: z.string().url().optional(),
  desktopPublicId: z.string().optional().nullable(),
  mobilePublicId: z.string().optional().nullable(),
  overlayColor: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  duration: z.number().int().min(2000).max(15000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slide = await prisma.heroSlide.findUnique({
      where: { id },
    });

    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    return NextResponse.json(slide);
  } catch (error: unknown) {
    console.error("[HERO_SLIDE_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch slide" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateSlideSchema.parse(body);

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(slide);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("[HERO_SLIDE_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.heroSlide.delete({
        where: { id },
      });

      // Re-normalise sortOrder values for remaining slides
      const remainingSlides = await tx.heroSlide.findMany({
        orderBy: { sortOrder: "asc" },
      });

      for (let i = 0; i < remainingSlides.length; i++) {
        await tx.heroSlide.update({
          where: { id: remainingSlides[i].id },
          data: { sortOrder: i },
        });
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error("[HERO_SLIDE_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
