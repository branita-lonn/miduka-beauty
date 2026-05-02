// components/dashboard/delivery-zones-client.tsx
// Client component for the delivery zones management table with Sheet-based
// create/edit workflow and inline delete with confirmation.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  MapPin,
  Truck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { InlineConfirmDelete } from "@/components/dashboard/inline-confirm-delete";
import { DeliveryZoneForm, DeliveryZoneData } from "@/components/dashboard/delivery-zone-form";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryZone {
  id: string;
  name: string;
  counties: string[];
  shippingCost: number;
  freeShippingThreshold: number | null;
  isActive: boolean;
  sortOrder: number;
}

interface DeliveryZonesClientProps {
  initialZones: DeliveryZone[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Summarise the county list — show first 3, then "+N more". */
function formatCounties(counties: string[]): string {
  if (counties.length === 0) return "—";
  if (counties.length <= 3) return counties.join(", ");
  const rest = counties.length - 3;
  return `${counties.slice(0, 3).join(", ")} +${rest} more`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeliveryZonesClient({ initialZones }: DeliveryZonesClientProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZoneData | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingZone(null);
    setSheetOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingZone({
      id: zone.id,
      name: zone.name,
      counties: zone.counties,
      shippingCost: zone.shippingCost,
      freeShippingThreshold: zone.freeShippingThreshold,
      isActive: zone.isActive,
    });
    setSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/delivery-zones/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete zone");
      }
      toast.success("Delivery zone deleted");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(message);
    }
  };

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      setTogglingId(zone.id);
      const res = await fetch(`/api/dashboard/delivery-zones/${zone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !zone.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update zone");
      }
      toast.success(
        zone.isActive ? "Zone deactivated" : "Zone activated"
      );
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Zones</h1>
          <p className="text-muted-foreground mt-1">
            Manage shipping regions and costs across Kenya&apos;s 47 counties.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Zone
        </Button>
      </div>

      {/* ── Summary Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{initialZones.length}</p>
                <p className="text-xs text-muted-foreground">Total Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10">
                <ToggleRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {initialZones.filter((z) => z.isActive).length}
                </p>
                <p className="text-xs text-muted-foreground">Active Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border bg-card shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(initialZones.flatMap((z) => z.counties)).size}
                </p>
                <p className="text-xs text-muted-foreground">Counties Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Zones Table ──────────────────────────────────────────────────── */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Shipping Zones</CardTitle>
          <CardDescription>
            Each zone maps a set of counties to a flat shipping rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {initialZones.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No delivery zones yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Add your first zone to start calculating shipping costs at
                checkout.
              </p>
              <Button onClick={openCreate} className="rounded-full mt-2 gap-2">
                <Plus className="h-4 w-4" />
                Add Zone
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Zone Name</TableHead>
                    <TableHead>Counties</TableHead>
                    <TableHead>Shipping Cost</TableHead>
                    <TableHead>Free Shipping Above</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialZones.map((zone) => (
                    <TableRow
                      key={zone.id}
                      className={!zone.isActive ? "opacity-60" : undefined}
                    >
                      {/* Name */}
                      <TableCell className="pl-6 font-medium">
                        {zone.name}
                      </TableCell>

                      {/* Counties summary */}
                      <TableCell>
                        <span
                          className="text-sm text-muted-foreground"
                          title={zone.counties.join(", ")}
                        >
                          {formatCounties(zone.counties)}
                        </span>
                      </TableCell>

                      {/* Shipping cost */}
                      <TableCell className="font-medium">
                        {zone.shippingCost === 0 ? (
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          >
                            Free
                          </Badge>
                        ) : (
                          formatCurrency(zone.shippingCost)
                        )}
                      </TableCell>

                      {/* Free shipping threshold */}
                      <TableCell className="text-muted-foreground">
                        {zone.freeShippingThreshold != null
                          ? `Over ${formatCurrency(zone.freeShippingThreshold)}`
                          : "—"}
                      </TableCell>

                      {/* Active badge + toggle */}
                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(zone)}
                          disabled={togglingId === zone.id}
                          className="flex items-center gap-1.5 transition-opacity hover:opacity-70 disabled:opacity-40 cursor-pointer"
                          title={zone.isActive ? "Click to deactivate" : "Click to activate"}
                        >
                          {zone.isActive ? (
                            <>
                              <ToggleRight className="h-4 w-4 text-green-600" />
                              <Badge
                                variant="secondary"
                                className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              >
                                Active
                              </Badge>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              <Badge
                                variant="secondary"
                                className="rounded-full"
                              >
                                Inactive
                              </Badge>
                            </>
                          )}
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => openEdit(zone)}
                            title="Edit zone"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <InlineConfirmDelete
                            onDelete={() => handleDelete(zone.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create / Edit Sheet ──────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingZone ? "Edit Delivery Zone" : "Add Delivery Zone"}
            </SheetTitle>
            <SheetDescription>
              {editingZone
                ? "Update the zone details below."
                : "Define a new shipping region with a flat rate for selected counties."}
            </SheetDescription>
          </SheetHeader>
          <DeliveryZoneForm
            initialData={editingZone ?? undefined}
            onSuccess={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
