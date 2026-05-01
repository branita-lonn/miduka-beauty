// app/api/stock-alerts/route.ts
// API route for "Notify me when back in stock" subscriptions

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { productId, variantId, email: guestEmail } = body;

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const email = session?.user?.email || guestEmail;

    if (!email) {
      return new NextResponse("Email is required for guests", { status: 400 });
    }

    // Check for existing active alert
    const existingAlert = await prisma.stockAlert.findFirst({
      where: {
        email,
        productId,
        variantId: variantId || null,
        isNotified: false,
      },
    });

    if (existingAlert) {
      return new NextResponse("You're already on the list for this item", { status: 409 });
    }

    // Create the alert
    const alert = await prisma.stockAlert.create({
      data: {
        email,
        productId,
        variantId: variantId || null,
        customerId: session?.user?.id || null,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("[STOCK_ALERTS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
