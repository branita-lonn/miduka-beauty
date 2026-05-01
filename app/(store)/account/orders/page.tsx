// app/(store)/account/orders/page.tsx
// Customer order history list

import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight, PackageCheck } from "lucide-react";
import { OrderStatus, PaymentStatus } from "@prisma/client";

const statusStyles: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "outline-blue" | "outline-purple" | "outline-amber" | "outline-green" }> = {
  PLACED: { label: "Placed", variant: "outline-blue" as any },
  CONFIRMED: { label: "Confirmed", variant: "outline-purple" as any },
  SHIPPED: { label: "Shipped", variant: "outline-amber" as any },
  DELIVERED: { label: "Delivered", variant: "outline-green" as any },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

const paymentStatusStyles: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "outline-green" | "outline-amber" | "outline-red" }> = {
  PENDING: { label: "Pending", variant: "outline-amber" as any },
  PAID: { label: "Paid", variant: "outline-green" as any },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
};

export default async function OrdersPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const orders = await prisma.order.findMany({
    where: { customerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground">
          View and track all your orders in one place.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">No orders yet</h3>
            <p className="text-muted-foreground">
              When you place an order, it will appear here.
            </p>
          </div>
          <Button render={<Link href="/products" />} className="rounded-2xl shadow-md">
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-5 border rounded-2xl hover:border-primary/50 transition-all duration-200 bg-card hover:shadow-md"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <PackageCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                  <Badge variant={statusStyles[order.status].variant as any} className="rounded-full px-2.5 py-0.5">
                    {statusStyles[order.status].label}
                  </Badge>
                  <Badge variant={paymentStatusStyles[order.paymentStatus].variant as any} className="rounded-full px-2.5 py-0.5">
                    {paymentStatusStyles[order.paymentStatus].label}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0">
                <div className="flex flex-col sm:text-right">
                  <span className="text-xs text-muted-foreground">
                    {order._count.items} {order._count.items === 1 ? "item" : "items"}
                  </span>
                  <span className="text-lg font-bold">
                    {formatCurrency(Number(order.total))}
                  </span>
                </div>
                <Button variant="ghost" size="icon" render={<Link href={`/account/orders/${order.id}`} />} className="rounded-full shrink-0">
                  <ChevronRight className="w-5 h-5" />
                  <span className="sr-only">View details</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
