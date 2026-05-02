// components/dashboard/delivery-zone-form.tsx
// Reusable form for creating and editing a delivery zone.
// Used inside a Sheet in the delivery-zones dashboard page.

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Kenya's 47 Counties ──────────────────────────────────────────────────────

export const KENYA_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
] as const;

// ─── Schema ───────────────────────────────────────────────────────────────────

const deliveryZoneSchema = z.object({
  name: z.string().min(1, "Zone name is required").max(100),
  counties: z
    .array(z.string())
    .min(1, "Select at least one county"),
  shippingCost: z.coerce
    .number()
    .nonnegative("Shipping cost cannot be negative"),
  freeShippingThreshold: z.coerce
    .number()
    .nonnegative()
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
});

type DeliveryZoneFormValues = z.infer<typeof deliveryZoneSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DeliveryZoneData {
  id: string;
  name: string;
  counties: string[];
  shippingCost: number;
  freeShippingThreshold: number | null;
  isActive: boolean;
}

interface DeliveryZoneFormProps {
  /** Populated when editing an existing zone. Undefined when creating. */
  initialData?: DeliveryZoneData;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeliveryZoneForm({ initialData, onSuccess }: DeliveryZoneFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<DeliveryZoneFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(deliveryZoneSchema) as any,
    defaultValues: {
      name: initialData?.name ?? "",
      counties: initialData?.counties ?? [],
      shippingCost: initialData?.shippingCost ?? 0,
      freeShippingThreshold: initialData?.freeShippingThreshold ?? "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const selectedCounties = form.watch("counties");

  const toggleCounty = (county: string, checked: boolean) => {
    const current = form.getValues("counties");
    if (checked) {
      form.setValue("counties", [...current, county], { shouldValidate: true });
    } else {
      form.setValue(
        "counties",
        current.filter((c) => c !== county),
        { shouldValidate: true }
      );
    }
  };

  const toggleAll = () => {
    if (selectedCounties.length === KENYA_COUNTIES.length) {
      form.setValue("counties", [], { shouldValidate: true });
    } else {
      form.setValue("counties", [...KENYA_COUNTIES], { shouldValidate: true });
    }
  };

  const onSubmit = async (values: DeliveryZoneFormValues) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        freeShippingThreshold:
          values.freeShippingThreshold === "" || values.freeShippingThreshold === undefined
            ? null
            : Number(values.freeShippingThreshold),
      };

      const url = initialData
        ? `/api/dashboard/delivery-zones/${initialData.id}`
        : "/api/dashboard/delivery-zones";

      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save zone");

      toast.success(initialData ? "Zone updated" : "Zone created");
      router.refresh();
      onSuccess();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const allSelected = selectedCounties.length === KENYA_COUNTIES.length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Zone Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zone Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Nairobi Metro"
                  className="rounded-full"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Shipping Cost */}
        <FormField
          control={form.control}
          name="shippingCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shipping Cost (KES)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 250"
                  className="rounded-full"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter 0 for free shipping on this zone.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Free Shipping Threshold */}
        <FormField
          control={form.control}
          name="freeShippingThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Free Shipping Threshold (KES) — Optional</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 5000"
                  className="rounded-full"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Orders above this amount get free shipping in this zone. Leave
                blank to disable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Counties Multi-select */}
        <FormField
          control={form.control}
          name="counties"
          render={() => (
            <FormItem>
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-sm font-medium leading-none">
                  Counties{" "}
                  <span className="text-muted-foreground font-normal">
                    ({selectedCounties.length} / {KENYA_COUNTIES.length} selected)
                  </span>
                </FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs rounded-full"
                  onClick={toggleAll}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <ScrollArea className="h-64 rounded-2xl border p-3">
                <div className="grid grid-cols-2 gap-2">
                  {KENYA_COUNTIES.map((county) => (
                    <div
                      key={county}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        id={`county-${county}`}
                        checked={selectedCounties.includes(county)}
                        onCheckedChange={(checked) =>
                          toggleCounty(county, checked === true)
                        }
                        className="rounded"
                      />
                      <label
                        htmlFor={`county-${county}`}
                        className="text-sm cursor-pointer select-none leading-none"
                      >
                        {county}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Active */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <div>
                <FormLabel>Active</FormLabel>
                <FormDescription className="text-xs">
                  Inactive zones are hidden from checkout.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full rounded-full"
          disabled={loading}
        >
          {loading
            ? initialData
              ? "Saving..."
              : "Creating..."
            : initialData
            ? "Save Changes"
            : "Create Zone"}
        </Button>
      </form>
    </Form>
  );
}
