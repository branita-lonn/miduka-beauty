// app/(store)/account/orders/[orderId]/page.tsx
// Detailed order view for customer

import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock,
  CreditCard,
  MapPin,
  FileText
} from "lucide-react";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import Image from "next/image";

interface OrderDetailPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

const statusStyles: Record<OrderStatus, { label: string; variant: string }> = {
  PLACED: { label: "Placed", variant: "outline-blue" },
  CONFIRMED: { label: "Confirmed", variant: "outline-purple" },
  SHIPPED: { label: "Shipped", variant: "outline-amber" },
  DELIVERED: { label: "Delivered", variant: "outline-green" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

const paymentStatusStyles: Record<PaymentStatus, { label: string; variant: string }> = {
  PENDING: { label: "Pending", variant: "outline-amber" },
  PAID: { label: "Paid", variant: "outline-green" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth();
  const userId = session?.user?.id;
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                take: 1,
              },
            },
          },
        },
      },
      shippingAddress: true,
    },
  });

  // Security check: verify order exists and belongs to current customer
  if (!order || order.customerId !== userId) {
    notFound();
  }

  const steps = [
    { status: "PLACED", label: "Order Placed", icon: Clock },
    { status: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
    { status: "SHIPPED", label: "Shipped", icon: Truck },
    { status: "DELIVERED", label: "Delivered", icon: Package },
  ];

  const currentStatusIndex = steps.findIndex((step) => step.status === order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/account/orders" />} className="w-fit -ml-2 rounded-xl">
          <ChevronLeft className="w-4 h-4" />
          Back to Orders
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Order {order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusStyles[order.status].variant as any} className="rounded-full px-3 py-1 text-xs">
              {statusStyles[order.status].label}
            </Badge>
            <Badge variant={paymentStatusStyles[order.paymentStatus].variant as any} className="rounded-full px-3 py-1 text-xs">
              {paymentStatusStyles[order.paymentStatus].label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items and Timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Timeline */}
          {!isCancelled && (
            <div className="bg-muted/30 border rounded-3xl p-6">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                Delivery Status
              </h3>
              <div className="relative flex flex-col gap-8 ml-4">
                {steps.map((step, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isLast = index === steps.length - 1;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex gap-4 relative">
                      {!isLast && (
                        <div 
                          className={`absolute left-[11px] top-[26px] w-[2px] h-[calc(100%+8px)] ${
                            index < currentStatusIndex ? "bg-primary" : "bg-border"
                          }`} 
                        />
                      )}
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        isCompleted ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted-foreground/30 text-muted-foreground"
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </span>
                        {isCompleted && (
                          <span className="text-xs text-muted-foreground">
                            {index === 0 ? formatDate(order.createdAt) : "In Progress"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="bg-destructive/5 border-destructive/20 border rounded-3xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-destructive rotate-45" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-destructive">Order Cancelled</h3>
                <p className="text-sm text-destructive/80">
                  This order was cancelled and will not be processed.
                </p>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="border rounded-3xl overflow-hidden">
            <div className="bg-muted/30 px-6 py-4 border-b">
              <h3 className="font-semibold">Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/10 text-muted-foreground">
                    <th className="px-6 py-3 text-left font-medium">Product</th>
                    <th className="px-6 py-3 text-center font-medium">Quantity</th>
                    <th className="px-6 py-3 text-right font-medium">Price</th>
                    <th className="px-6 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 min-w-[200px]">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border shrink-0 bg-muted">
                            {item.product.images[0]?.url ? (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.productName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold line-clamp-1">{item.productName}</span>
                            {item.variantLabel && (
                              <span className="text-xs text-muted-foreground">{item.variantLabel}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{item.quantity}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                      <td className="px-6 py-4 text-right font-bold">{formatCurrency(Number(item.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Summaries and Addresses */}
        <div className="space-y-8">
          {/* Order Summary */}
          <div className="border rounded-3xl p-6 bg-card shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(Number(order.shippingCost))}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-{formatCurrency(Number(order.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(Number(order.taxAmount))}</span>
              </div>
              <div className="pt-4 mt-2 border-t flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border rounded-3xl p-6 bg-card shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Shipping Address
            </h3>
            <div className="text-sm space-y-1">
              <p className="font-semibold">{order.shippingAddress.fullName}</p>
              <p className="text-muted-foreground">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-muted-foreground">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.county}
              </p>
              {order.shippingAddress.postalCode && (
                <p className="text-muted-foreground">{order.shippingAddress.postalCode}</p>
              )}
              <p className="pt-2 text-muted-foreground">{order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border rounded-3xl p-6 bg-card shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Payment
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Method:</span>
                <span className="text-muted-foreground">{order.paymentMethod}</span>
              </div>
              {order.mpesaReceiptNumber && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Receipt:</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{order.mpesaReceiptNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={paymentStatusStyles[order.paymentStatus].variant as any} className="rounded-full text-[10px] px-2 py-0">
                  {paymentStatusStyles[order.paymentStatus].label}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
