// app/dashboard/customers/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CustomersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <Skeleton className="h-12 w-full lg:w-[400px] rounded-2xl" />
        <div className="flex w-full lg:w-auto gap-2">
            <Skeleton className="h-11 flex-1 lg:w-64 rounded-2xl" />
            <Skeleton className="h-11 w-24 rounded-2xl" />
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
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                </TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
