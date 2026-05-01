// app/dashboard/customers/[customerId]/page.tsx
// Detailed customer profile and history for sellers.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard, 
  ShoppingBag, 
  TrendingUp,
  MapPin,
  Eye,
  ShoppingCart,
  Package,
  Tags,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/orders/status-badge";
import { Badge } from "@/components/ui/badge";

interface CustomerDetailPageProps {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
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
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { name: true, slug: true } } }
      },
      loyaltyAccount: {
        include: {
          transactions: {
            take: 5,
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });

  if (!user) {
    notFound();
  }

  const paidOrders = user.orders.filter(o => o.paymentStatus === "PAID");
  const ltv = paidOrders.reduce((acc, o) => acc + Number(o.total), 0);
  const aov = paidOrders.length > 0 ? ltv / paidOrders.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-border/50 overflow-hidden">
                {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <span>{user.name?.charAt(0)}</span>}
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{user.name || "Unnamed Customer"}</h1>
                <p className="text-sm text-muted-foreground">Customer since {format(user.createdAt, "MMMM yyyy")}</p>
            </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Spend (LTV)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ltv)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Across {paidOrders.length} paid orders</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg. Order Value</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(aov)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Wallet share per visit</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.orders.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Including cancelled & pending</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Join Date</CardTitle>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(user.createdAt, "MMM dd")}</div>
            <p className="text-[10px] text-muted-foreground mt-1">{format(user.createdAt, "yyyy")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact & Addresses */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email || "No email provided"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone || user.addresses[0]?.phone || "No phone provided"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Saved Addresses</CardTitle>
              <Badge variant="outline" className="rounded-full">{user.addresses.length}</Badge>
            </CardHeader>
            <CardContent className="p-0">
                {user.addresses.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground italic">No addresses saved.</div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {user.addresses.map((address) => (
                            <div key={address.id} className="p-4 flex gap-3 items-start">
                                <MapPin className="h-4 w-4 text-primary mt-1 shrink-0" />
                                <div className="text-xs space-y-1">
                                    <p className="font-bold">{address.fullName}</p>
                                    <p>{address.addressLine1}</p>
                                    <p>{address.city}, {address.county}</p>
                                    <p className="text-muted-foreground">{address.phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                Loyalty Program
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance</span>
                <span className="text-lg font-bold text-amber-600">{user.loyaltyAccount?.points || 0} pts</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lifetime Earned</span>
                <span className="text-sm font-medium">{user.loyaltyAccount?.lifetimePoints || 0} pts</span>
              </div>
              
              {user.loyaltyAccount?.transactions && user.loyaltyAccount.transactions.length > 0 && (
                <div className="pt-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</p>
                  <div className="space-y-2">
                    {user.loyaltyAccount.transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-start text-xs">
                        <div className="space-y-0.5">
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-[10px] text-muted-foreground">{format(tx.createdAt, "MMM dd")}</p>
                        </div>
                        <span className={cn(
                          "font-bold",
                          tx.type === "EARN" ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {tx.type === "EARN" ? "+" : "-"}{tx.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
             <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Order History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {user.orders.length === 0 ? (
                 <div className="p-10 text-center text-muted-foreground">No orders yet.</div>
               ) : (
                 <div className="divide-y divide-border/50">
                    {user.orders.map((order) => (
                        <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div className="space-y-1">
                                <Link href={`/dashboard/orders/${order.id}`} className="font-mono text-xs font-bold hover:text-primary transition-colors">
                                    {order.orderNumber}
                                </Link>
                                <p className="text-[10px] text-muted-foreground">{format(order.createdAt, "PPP")}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-bold">{formatCurrency(Number(order.total))}</p>
                                    <StatusBadge status={order.paymentStatus} type="payment" />
                                </div>
                                <StatusBadge status={order.status} type="order" />
                            </div>
                        </div>
                    ))}
                 </div>
               )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 bg-card/50 shadow-sm overflow-hidden">
             <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Recent Engagement</CardTitle>
              <CardDescription>Activity from the last session</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               {user.engagements.length === 0 ? (
                 <div className="p-10 text-center text-muted-foreground italic text-xs">No recent activity tracked.</div>
               ) : (
                 <div className="divide-y divide-border/50">
                    {user.engagements.map((eng) => (
                        <div key={eng.id} className="p-4 flex items-center gap-4">
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                eng.type === "VIEW" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                                {eng.type === "VIEW" ? <Eye className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium">
                                    {eng.type === "VIEW" ? "Viewed" : "Added to Cart"} <strong>{eng.product.name}</strong>
                                </p>
                                <p className="text-[10px] text-muted-foreground">{format(eng.createdAt, "MMM dd 'at' HH:mm")}</p>
                            </div>
                        </div>
                    ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
