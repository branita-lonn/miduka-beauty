// components/store/product-filters.tsx
// Client component — URL-param-driven filter sidebar / bottom sheet

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  sizes: string[];
  colours: string[];
  /** If set, category filter is locked to this slug (category page) */
  lockedCategory?: string;
}

function FiltersContent({
  sizes,
  colours,
  lockedCategory,
  onClose,
}: ProductFiltersProps & { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current values
  const currentMin = searchParams.get("minPrice") ?? "";
  const currentMax = searchParams.get("maxPrice") ?? "";
  const currentSizes = searchParams.get("size")?.split(",").filter(Boolean) ?? [];
  const currentColours = searchParams.get("colour")?.split(",").filter(Boolean) ?? [];
  const currentOnSale = searchParams.get("onSale") === "true";
  const currentInStock = searchParams.get("inStock") === "true";

  const [minPrice, setMinPrice] = useState(currentMin);
  const [maxPrice, setMaxPrice] = useState(currentMax);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(currentSizes);
  const [selectedColours, setSelectedColours] = useState<string[]>(currentColours);
  const [onSale, setOnSale] = useState(currentOnSale);
  const [inStock, setInStock] = useState(currentInStock);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    if (minPrice) params.set("minPrice", minPrice); else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice); else params.delete("maxPrice");
    if (selectedSizes.length) params.set("size", selectedSizes.join(",")); else params.delete("size");
    if (selectedColours.length) params.set("colour", selectedColours.join(",")); else params.delete("colour");
    if (onSale) params.set("onSale", "true"); else params.delete("onSale");
    if (inStock) params.set("inStock", "true"); else params.delete("inStock");
    if (lockedCategory) params.set("category", lockedCategory);

    router.push(`${pathname}?${params.toString()}`);
    onClose?.();
  }, [minPrice, maxPrice, selectedSizes, selectedColours, onSale, inStock, router, pathname, searchParams, lockedCategory, onClose]);

  function clearAll() {
    const params = new URLSearchParams();
    if (lockedCategory) params.set("category", lockedCategory);
    setMinPrice(""); setMaxPrice(""); setSelectedSizes([]); setSelectedColours([]); setOnSale(false); setInStock(false);
    router.push(`${pathname}?${params.toString()}`);
    onClose?.();
  }

  function toggleArr(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  const hasFilters = minPrice || maxPrice || selectedSizes.length || selectedColours.length || onSale || inStock;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Price Range */}
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm text-foreground">Price (KES)</h3>
        <div className="flex items-center gap-2">
          <Input
            id="filter-min-price"
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="rounded-xl"
            min={0}
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            id="filter-max-price"
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-xl"
            min={0}
          />
        </div>
      </div>

      {/* Sizes */}
      {sizes.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-sm text-foreground">Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                id={`filter-size-${size}`}
                onClick={() => toggleArr(selectedSizes, setSelectedSizes, size)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm border transition-colors",
                  selectedSizes.includes(size)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-foreground hover:border-primary/50"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colours */}
      {colours.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-sm text-foreground">Colour</h3>
          <div className="flex flex-wrap gap-2">
            {colours.map((colour) => (
              <button
                key={colour}
                id={`filter-colour-${colour}`}
                onClick={() => toggleArr(selectedColours, setSelectedColours, colour)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm border transition-colors",
                  selectedColours.includes(colour)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-foreground hover:border-primary/50"
                )}
              >
                {colour}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggles */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="filter-on-sale"
            checked={onSale}
            onCheckedChange={(v) => setOnSale(Boolean(v))}
          />
          <Label htmlFor="filter-on-sale" className="cursor-pointer">On Sale</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="filter-in-stock"
            checked={inStock}
            onCheckedChange={(v) => setInStock(Boolean(v))}
          />
          <Label htmlFor="filter-in-stock" className="cursor-pointer">In Stock Only</Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-4">
        <Button onClick={applyFilters} className="flex-1 rounded-full">
          Apply Filters
        </Button>
        {hasFilters && (
          <Button variant="outline" onClick={clearAll} className="rounded-full px-4">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ProductFilters(props: ProductFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Filters</h2>
        </div>
        <FiltersContent {...props} />
      </aside>

      {/* Mobile sheet trigger */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger render={<Button variant="outline" className="md:hidden rounded-full gap-2" id="mobile-filter-btn" />}>
          <Filter className="h-4 w-4" />
          Filters
        </SheetTrigger>
        <SheetContent side="left" className="w-80 flex flex-col gap-6 pt-8">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <FiltersContent {...props} onClose={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
