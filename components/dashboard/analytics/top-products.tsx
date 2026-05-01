// components/dashboard/analytics/top-products.tsx
// Tabbed table showing top performing products by revenue and units.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface ProductRow {
  productId: string;
  name: string;
  slug: string;
  revenue?: number;
  unitsSold: number;
  image?: string;
}

interface TopProductsProps {
  byRevenue: ProductRow[];
  byUnits: ProductRow[];
}

export function TopProducts({ byRevenue, byUnits }: TopProductsProps) {
  const renderList = (products: ProductRow[], type: 'revenue' | 'units') => {
    if (products.length === 0) {
      return <div className="py-10 text-center text-muted-foreground">No data for this period</div>;
    }

    const maxVal = type === 'revenue' 
      ? Math.max(...products.map(p => p.revenue || 0))
      : Math.max(...products.map(p => p.unitsSold));

    return (
      <div className="space-y-4 pt-4">
        {products.map((product) => {
          const currentVal = type === 'revenue' ? (product.revenue || 0) : product.unitsSold;
          const percentage = maxVal > 0 ? (currentVal / maxVal) * 100 : 0;

          return (
            <div key={product.productId} className="flex items-center gap-4 group">
              <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-muted border border-border/50 shrink-0">
                {product.image ? (
                  <Image 
                    src={product.image} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-300" 
                    sizes="48px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Link 
                    href={`/dashboard/products/${product.productId}`}
                    className="text-sm font-semibold truncate hover:text-primary transition-colors"
                  >
                    {product.name}
                  </Link>
                  <span className="text-sm font-bold">
                    {type === 'revenue' ? formatCurrency(product.revenue || 0) : `${product.unitsSold} units`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Top Products</CardTitle>
        <CardDescription>Highest performing items in the store</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/50 p-1">
            <TabsTrigger value="revenue" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">By Revenue</TabsTrigger>
            <TabsTrigger value="units" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">By Units Sold</TabsTrigger>
          </TabsList>
          <TabsContent value="revenue">
            {renderList(byRevenue, 'revenue')}
          </TabsContent>
          <TabsContent value="units">
            {renderList(byUnits, 'units')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
