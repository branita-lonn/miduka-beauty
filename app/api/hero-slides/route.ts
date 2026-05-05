// app/api/hero-slides/route.ts
// Public endpoint — returns active hero slides for storefront and client-side revalidation

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json({ slides });
  } catch (error: unknown) {
    console.error("[HERO_SLIDES_PUBLIC_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch hero slides" }, { status: 500 });
  }
}
