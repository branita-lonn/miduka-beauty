// app/dashboard/delivery-zones/page.tsx
// Delivery Zone management page — seller can view, create, edit, and delete
// delivery zones that are used at checkout to calculate shipping costs.

import { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DeliveryZonesClient } from "@/components/dashboard/delivery-zones-client";

export const metadata: Metadata = {
  title: "Delivery Zones | MiDuka Dashboard",
  description: "Manage Kenya delivery zones and shipping costs",
};

export default async function DeliveryZonesPage() {
  const session = await auth();

  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/auth/login");
  }

  const zones = await prisma.deliveryZone.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  // Serialize Decimal fields to numbers for the client component
  const serializedZones = zones.map((z) => ({
    ...z,
    shippingCost: Number(z.shippingCost),
    freeShippingThreshold:
      z.freeShippingThreshold != null ? Number(z.freeShippingThreshold) : null,
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DeliveryZonesClient initialZones={serializedZones} />
    </div>
  );
}
