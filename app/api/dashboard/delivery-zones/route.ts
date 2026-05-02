// app/api/dashboard/delivery-zones/route.ts
// API route for managing delivery zones (GET list, POST create).
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/delivery-zones
 * Returns all delivery zones ordered by sortOrder then name.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const zones = await prisma.deliveryZone.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(zones);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[DELIVERY_ZONES_GET] ${error.message}`);
    } else {
      console.error("[DELIVERY_ZONES_GET] Unknown error");
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/delivery-zones
 * Creates a new delivery zone.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, counties, shippingCost, freeShippingThreshold, isActive } =
      body as {
        name: string;
        counties: string[];
        shippingCost: number;
        freeShippingThreshold?: number | null;
        isActive?: boolean;
      };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Zone name is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(counties) || counties.length === 0) {
      return NextResponse.json(
        { error: "At least one county must be selected" },
        { status: 400 }
      );
    }

    if (typeof shippingCost !== "number" || shippingCost < 0) {
      return NextResponse.json(
        { error: "Shipping cost must be a non-negative number" },
        { status: 400 }
      );
    }

    // Determine the next sortOrder value
    const maxOrder = await prisma.deliveryZone.aggregate({
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const zone = await prisma.deliveryZone.create({
      data: {
        name: name.trim(),
        counties,
        shippingCost,
        freeShippingThreshold:
          freeShippingThreshold != null ? freeShippingThreshold : null,
        isActive: isActive ?? true,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(zone, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[DELIVERY_ZONES_POST] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("[DELIVERY_ZONES_POST] Unknown error");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
