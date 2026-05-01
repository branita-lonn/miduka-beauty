// components/dashboard/customers/customer-table.tsx
// Table for listing and filtering customers with metrics and export.

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { 
  Search, 
  Download, 
  ExternalLink,
  Users,
  Star,
  UserPlus,
  Clock
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CustomerRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  createdAt: string;
  orderCount: number;
  ltv: number;
  lastOrderDate: string | null;
  segment: string;
}

interface CustomerTableProps {
  customers: CustomerRow[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const currentSegment = searchParams.get("segment") || "all";

  const updateFilters = (newParams: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    router.push(`?${nextParams.toString()}`);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Segment", "Join Date", "Orders", "LTV", "Last Order"];
    const rows = customers.map(c => [
      c.name || "N/A",
      c.email || "N/A",
      c.phone || "N/A",
      c.segment,
      format(new Date(c.createdAt), "yyyy-MM-dd"),
      c.orderCount,
      c.ltv,
      c.lastOrderDate ? format(new Date(c.lastOrderDate), "yyyy-MM-dd") : "N/A"
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers-export-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case "VIP": return <Badge className="bg-amber-500/10 text-amber-500 border-none rounded-full px-3 py-0.5"><Star className="h-3 w-3 mr-1 fill-amber-500" /> VIP</Badge>;
      case "New": return <Badge className="bg-blue-500/10 text-blue-500 border-none rounded-full px-3 py-0.5"><UserPlus className="h-3 w-3 mr-1" /> New</Badge>;
      case "Inactive": return <Badge className="bg-slate-500/10 text-slate-500 border-none rounded-full px-3 py-0.5"><Clock className="h-3 w-3 mr-1" /> Inactive</Badge>;
      default: return <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full px-3 py-0.5">Regular</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <Tabs defaultValue={currentSegment} onValueChange={(val) => updateFilters({ segment: val === "all" ? null : val })} className="w-full lg:w-auto">
          <TabsList className="bg-muted/50 rounded-2xl p-1 w-full lg:w-auto overflow-x-auto h-auto">
            <TabsTrigger value="all" className="rounded-xl px-4 py-2">All Customers</TabsTrigger>
            <TabsTrigger value="vip" className="rounded-xl px-4 py-2">VIPs</TabsTrigger>
            <TabsTrigger value="new" className="rounded-xl px-4 py-2">New</TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-xl px-4 py-2">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex w-full lg:w-auto gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateFilters({ q: search })}
              className="pl-9 rounded-2xl border-border/50 bg-background/50 h-11"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            className="rounded-2xl border-border/50 h-11 px-4 gap-2 shrink-0 hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border/50 bg-card/50 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">LTV</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden relative border border-border/50">
                        {c.image ? (
                          <img src={c.image} alt={c.name || ""} className="object-cover w-full h-full" />
                        ) : (
                          <span>{c.name?.charAt(0) || "U"}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{c.name || "Unnamed Customer"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getSegmentBadge(c.segment)}</TableCell>
                  <TableCell className="text-right font-medium">{c.orderCount}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{formatCurrency(c.ltv)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.lastOrderDate ? format(new Date(c.lastOrderDate), "MMM dd, yyyy") : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/customers/${c.id}`}>
                      <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
