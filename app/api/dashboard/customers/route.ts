// app/api/dashboard/customers/route.ts
// Customers API — list customers with metrics and segments.
// STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, PaymentStatus } from "@prisma/client";
import { subDays } from "date-fns";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const segment = searchParams.get("segment"); // all, vip, new, inactive

    // Fetch customers with their orders (only paid orders for LTV)
    const users = await prisma.user.findMany({
      where: {
        role: UserRole.CUSTOMER,
        OR: q ? [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } }
        ] : undefined
      },
      include: {
        orders: {
          where: { paymentStatus: PaymentStatus.PAID },
          select: { total: true, createdAt: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const ninetyDaysAgo = subDays(now, 90);

    const customersWithMetrics = users.map(user => {
      const orderCount = user.orders.length;
      const ltv = user.orders.reduce((acc, o) => acc + Number(o.total), 0);
      const lastOrderDate = user.orders.length > 0 
        ? user.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt 
        : null;

      // Determine segment
      let customerSegment = "Regular";
      if (ltv >= 10000 || orderCount >= 5) customerSegment = "VIP";
      else if (user.createdAt >= thirtyDaysAgo) customerSegment = "New";
      else if (!lastOrderDate || lastOrderDate < ninetyDaysAgo) customerSegment = "Inactive";

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        createdAt: user.createdAt,
        orderCount,
        ltv,
        lastOrderDate,
        segment: customerSegment
      };
    });

    // Apply segment filter if present
    const filteredCustomers = segment && segment !== "all" 
      ? customersWithMetrics.filter(c => c.segment.toLowerCase() === segment.toLowerCase())
      : customersWithMetrics;

    return NextResponse.json(filteredCustomers);
  } catch (error: unknown) {
    console.error("[GET /api/dashboard/customers]", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
