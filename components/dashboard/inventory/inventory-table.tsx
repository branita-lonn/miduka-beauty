// components/dashboard/inventory/inventory-table.tsx
// Table for managing stock levels and low stock thresholds.

"use client";

import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Search,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface InventoryProduct {
  id: string;
  name: string;
  slug: string;
  stockQuantity: number;
  lowStockThreshold: number;
  category?: { name: string };
  images: { url: string }[];
  variants: {
    id: string;
    stockQuantity: number;
    lowStockThreshold: number;
    sku?: string | null;
    label?: string;
    attributes?: { key: string; value: string }[];
  }[];
}

interface InventoryTableProps {
  initialProducts: InventoryProduct[];
}

export function InventoryTable({ initialProducts }: InventoryTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdate = async (productId: string, variantId: string | null, field: 'stockQuantity' | 'lowStockThreshold', value: number) => {
    const key = `${productId}-${variantId || 'base'}`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(`/api/dashboard/inventory/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, [field]: value })
      });

      if (!response.ok) throw new Error("Failed to update");

      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          if (!variantId) {
            return { ...p, [field]: value };
          } else {
            return {
              ...p,
              variants: p.variants.map(v => v.id === variantId ? { ...v, [field]: value } : v)
            };
          }
        }
        return p;
      }));

      toast.success("Inventory updated");
    } catch (err) {
      toast.error("Failed to update inventory");
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.slug.toLowerCase().includes(search.toLowerCase());
    
    const isLowStock = (p.variants.length === 0 && p.stockQuantity <= p.lowStockThreshold) ||
                      (p.variants.some(v => v.stockQuantity <= v.lowStockThreshold));

    return matchesSearch && (!showLowStock || isLowStock);
  });

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock <= 0) return { label: "Out of Stock", class: "bg-rose-500/10 text-rose-500", icon: XCircle };
    if (stock <= threshold) return { label: "Low Stock", class: "bg-amber-500/10 text-amber-500", icon: AlertTriangle };
    return { label: "Healthy", class: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 p-4 rounded-3xl border border-border/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-2xl border-border/50 bg-background/50"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showLowStock ? "default" : "outline"}
            onClick={() => setShowLowStock(!showLowStock)}
            className="rounded-2xl gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {showLowStock ? "Showing Low Stock" : "Filter Low Stock"}
          </Button>
          <Button variant="outline" size="icon" className="rounded-2xl" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border/50 bg-card/50 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-32">Stock</TableHead>
              <TableHead className="w-32">Threshold</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const hasVariants = product.variants.length > 0;
              const status = !hasVariants ? getStockStatus(product.stockQuantity, product.lowStockThreshold) : null;
              const isExpanded = expandedRows[product.id];

              return (
                <React.Fragment key={product.id}>
                  <TableRow className={cn("hover:bg-muted/20 transition-colors", isExpanded && "bg-muted/10")}>
                    <TableCell>
                      {hasVariants && (
                        <Button variant="ghost" size="icon" onClick={() => toggleExpand(product.id)}>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted border border-border/50 overflow-hidden relative">
                          {product.images[0] ? (
                            <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[8px] text-muted-foreground uppercase">No Img</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{product.category?.name || "Uncategorized"}</TableCell>
                    <TableCell>
                      {!hasVariants ? (
                        <div className="relative group">
                          <Input 
                            type="number"
                            defaultValue={product.stockQuantity}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (val !== product.stockQuantity) handleUpdate(product.id, null, 'stockQuantity', val);
                            }}
                            className="h-8 rounded-xl w-24 bg-background/50 border-border/50 group-hover:border-primary/30 transition-colors"
                          />
                          {loadingStates[`${product.id}-base`] && <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-primary" />}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">See Variants ({product.variants.length})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!hasVariants && (
                        <div className="relative group">
                          <Input 
                            type="number"
                            defaultValue={product.lowStockThreshold}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (val !== product.lowStockThreshold) handleUpdate(product.id, null, 'lowStockThreshold', val);
                            }}
                            className="h-8 rounded-xl w-24 bg-background/50 border-border/50 group-hover:border-primary/30 transition-colors"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {status && (
                        <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 border-none", status.class)}>
                          <status.icon className="mr-1.5 h-3 w-3" />
                          {status.label}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                  {isExpanded && product.variants.map((variant) => {
                    const vStatus = getStockStatus(variant.stockQuantity, variant.lowStockThreshold);
                    return (
                      <TableRow key={variant.id} className="bg-muted/5 border-l-2 border-primary/20">
                        <TableCell></TableCell>
                        <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">
                              {variant.label || (variant.attributes || []).map((a) => a.value).filter(Boolean).join(" / ") || `Variant #${variant.id.slice(-4)}`}
                            </span>
                            <span className="text-[10px] text-muted-foreground">SKU: {variant.sku || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <div className="relative group">
                            <Input 
                              type="number"
                              defaultValue={variant.stockQuantity}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value);
                                if (val !== variant.stockQuantity) handleUpdate(product.id, variant.id, 'stockQuantity', val);
                              }}
                              className="h-8 rounded-xl w-24 bg-background/50 border-border/50 group-hover:border-primary/30 transition-colors"
                            />
                            {loadingStates[`${product.id}-${variant.id}`] && <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-primary" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative group">
                            <Input 
                              type="number"
                              defaultValue={variant.lowStockThreshold}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value);
                                if (val !== variant.lowStockThreshold) handleUpdate(product.id, variant.id, 'lowStockThreshold', val);
                              }}
                              className="h-8 rounded-xl w-24 bg-background/50 border-border/50 group-hover:border-primary/30 transition-colors"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 border-none", vStatus.class)}>
                            <vStatus.icon className="mr-1.5 h-3 w-3" />
                            {vStatus.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
