// app/api/dashboard/hero-slides/route.ts
// CRUD API for managing hero carousel slides — STORE_OWNER only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import * as z from "zod";

const createSlideSchema = z.object({
  headline: z.string().max(120).optional().nullable(),
  subheadline: z.string().max(200).optional().nullable(),
  ctaText: z.string().max(50).optional().nullable(),
  ctaLink: z.string().max(500).optional().nullable(),
  desktopImageUrl: z.string().url("Desktop image is required"),
  mobileImageUrl: z.string().url("Mobile image is required"),
  desktopPublicId: z.string().optional().nullable(),
  mobilePublicId: z.string().optional().nullable(),
  overlayColor: z.string().optional().default("rgba(0,0,0,0.35)"),
  textAlign: z.enum(["left", "center", "right"]).default("left"),
  duration: z.number().int().min(2000).max(15000).nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" }
      ],
    });

    return NextResponse.json(slides);
  } catch (error: unknown) {
    console.error("[HERO_SLIDES_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch slides" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createSlideSchema.parse(body);

    // Max 8 slides check
    const count = await prisma.heroSlide.count();
    if (count >= 8) {
      return NextResponse.json({ error: "Maximum of 8 hero slides allowed." }, { status: 400 });
    }

    // Auto-assign sortOrder if not provided
    let sortOrder = validatedData.sortOrder;
    if (sortOrder === undefined) {
      const lastSlide = await prisma.heroSlide.findFirst({
        orderBy: { sortOrder: "desc" },
      });
      sortOrder = (lastSlide?.sortOrder ?? -1) + 1;
    }

    const slide = await prisma.heroSlide.create({
      data: {
        ...validatedData,
        sortOrder,
        headline: validatedData.headline || null,
        subheadline: validatedData.subheadline || null,
        ctaText: validatedData.ctaText || null,
        ctaLink: validatedData.ctaLink || null,
        desktopPublicId: validatedData.desktopPublicId || null,
        mobilePublicId: validatedData.mobilePublicId || null,
      },
    });

    return NextResponse.json(slide, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("[HERO_SLIDE_CREATE_ERROR]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
