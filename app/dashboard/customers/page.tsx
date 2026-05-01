// app/dashboard/customers/page.tsx
// Customer management dashboard page.

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, PaymentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { CustomerTable } from "@/components/dashboard/customers/customer-table";
import { subDays } from "date-fns";

interface CustomersPageProps {
  searchParams: Promise<{
    q?: string;
    segment?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const session = await auth();

  if (!session || session.user?.role !== UserRole.STORE_OWNER) {
    redirect("/auth/login");
  }

  const { q, segment } = await searchParams;

  // Fetch all customers (we'll aggregate metrics in JS for now as it's a single seller store with moderate customer count)
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
    const sortedOrders = [...user.orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].createdAt : null;

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
      createdAt: user.createdAt.toISOString(),
      orderCount,
      ltv,
      lastOrderDate: lastOrderDate?.toISOString() || null,
      segment: customerSegment
    };
  });

  const filteredCustomers = segment && segment !== "all" 
    ? customersWithMetrics.filter(c => c.segment.toLowerCase() === segment.toLowerCase())
    : customersWithMetrics;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">Understand and manage your customer relationships.</p>
      </div>

      <CustomerTable customers={filteredCustomers} />
    </div>
  );
}
