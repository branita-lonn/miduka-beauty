// app/api/cart/items/[itemId]/route.ts
// Cart item API — PATCH (update quantity) and DELETE (remove item)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { getOrCreateCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SESSION_COOKIE = "miduka_session_id";

const updateSchema = z.object({
  quantity: z.number().int().min(0),
});

async function verifyItemOwnership(
  itemId: string,
  customerId: string | undefined,
  sessionId: string | undefined
): Promise<boolean> {
  const cart = await getOrCreateCart(customerId, sessionId);
  return cart.items.some((item) => item.id === itemId);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
): Promise<NextResponse> {
  try {
    const { itemId } = await params;
    const body: unknown = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const { quantity } = parsed.data;

    const session = await auth();
    const cookieStore = await cookies();
    const customerId = session?.user?.id;
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    const isOwner = await verifyItemOwnership(
      itemId,
      customerId,
      sessionId ?? undefined
    );
    if (!isOwner) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return NextResponse.json({ success: true, deleted: true });
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("[PATCH /api/cart/items/[itemId]]", error);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
): Promise<NextResponse> {
  try {
    const { itemId } = await params;

    const session = await auth();
    const cookieStore = await cookies();
    const customerId = session?.user?.id;
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    const isOwner = await verifyItemOwnership(
      itemId,
      customerId,
      sessionId ?? undefined
    );
    if (!isOwner) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[DELETE /api/cart/items/[itemId]]", error);
    return NextResponse.json(
      { error: "Failed to remove cart item" },
      { status: 500 }
    );
  }
}
