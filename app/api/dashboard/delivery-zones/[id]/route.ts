// app/api/dashboard/delivery-zones/[id]/route.ts
// API route for updating and deleting a single delivery zone.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/dashboard/delivery-zones/[id]
 * Updates an existing delivery zone.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, counties, shippingCost, freeShippingThreshold, isActive } =
      body as {
        name?: string;
        counties?: string[];
        shippingCost?: number;
        freeShippingThreshold?: number | null;
        isActive?: boolean;
      };

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Zone name cannot be empty" },
        { status: 400 }
      );
    }

    if (counties !== undefined && (!Array.isArray(counties) || counties.length === 0)) {
      return NextResponse.json(
        { error: "At least one county must be selected" },
        { status: 400 }
      );
    }

    if (shippingCost !== undefined && (typeof shippingCost !== "number" || shippingCost < 0)) {
      return NextResponse.json(
        { error: "Shipping cost must be a non-negative number" },
        { status: 400 }
      );
    }

    const updated = await prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(counties !== undefined && { counties }),
        ...(shippingCost !== undefined && { shippingCost }),
        // Allow explicit null to clear the threshold
        ...("freeShippingThreshold" in body && {
          freeShippingThreshold:
            freeShippingThreshold != null ? freeShippingThreshold : null,
        }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[DELIVERY_ZONE_PUT] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("[DELIVERY_ZONE_PUT] Unknown error");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/dashboard/delivery-zones/[id]
 * Deletes a delivery zone.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    await prisma.deliveryZone.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[DELIVERY_ZONE_DELETE] ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("[DELIVERY_ZONE_DELETE] Unknown error");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
