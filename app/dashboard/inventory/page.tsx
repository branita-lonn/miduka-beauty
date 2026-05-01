// app/dashboard/inventory/page.tsx
// Inventory management dashboard page.

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { InventoryTable } from "@/components/dashboard/inventory/inventory-table";

export default async function InventoryPage() {
  const session = await auth();

  if (!session || session.user?.role !== UserRole.STORE_OWNER) {
    redirect("/auth/login");
  }

  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { createdAt: "asc" }
      },
      images: {
        take: 1,
        orderBy: { sortOrder: "asc" }
      },
      category: {
        select: { name: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Monitor and manage your product stock levels.</p>
      </div>

      <InventoryTable initialProducts={JSON.parse(JSON.stringify(products))} />
    </div>
  );
}
