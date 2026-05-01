// app/api/cart/route.ts
// Cart API — GET (fetch or create cart) and DELETE (clear cart)

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { getOrCreateCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "miduka_session_id";

/** Generates a random session ID for guests */
function generateSessionId(): string {
  return (
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  );
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    const cookieStore = await cookies();

    const customerId = session?.user?.id;

    let sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    const cart = await getOrCreateCart(customerId, sessionId ?? undefined);

    const response = NextResponse.json(cart);

    // Set guest session cookie if not present
    if (!customerId && !sessionId) {
      sessionId = generateSessionId();
      response.cookies.set(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error: unknown) {
    console.error("[GET /api/cart]", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    const session = await auth();
    const cookieStore = await cookies();

    const customerId = session?.user?.id;
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    const cart = await getOrCreateCart(customerId, sessionId ?? undefined);

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[DELETE /api/cart]", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
