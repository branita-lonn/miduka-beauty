// app/api/dashboard/customers/[customerId]/route.ts
// Customer detail API — get full profile and history.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: { select: { productName: true, quantity: true } } }
        },
        addresses: true,
        engagements: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { product: { select: { name: true, slug: true } } }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Basic aggregation
    const paidOrders = user.orders.filter(o => o.paymentStatus === "PAID");
    const ltv = paidOrders.reduce((acc, o) => acc + Number(o.total), 0);
    const aov = paidOrders.length > 0 ? ltv / paidOrders.length : 0;

    return NextResponse.json({
      ...user,
      metrics: {
        totalOrders: user.orders.length,
        paidOrders: paidOrders.length,
        ltv,
        aov
      }
    });
  } catch (error: unknown) {
    console.error("[GET /api/dashboard/customers/[customerId]]", error);
    return NextResponse.json({ error: "Failed to fetch customer detail" }, { status: 500 });
  }
}
