// app/api/dashboard/hero-slides/reorder/route.ts
// Batch sortOrder update for drag-to-reorder — STORE_OWNER only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import * as z from "zod";

const reorderSchema = z.object({
  slides: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int().min(0),
    })
  ),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { slides } = reorderSchema.parse(body);

    await prisma.$transaction(
      slides.map(({ id, sortOrder }) =>
        prisma.heroSlide.update({
          where: { id },
          data: { sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("[HERO_SLIDES_REORDER_ERROR]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
