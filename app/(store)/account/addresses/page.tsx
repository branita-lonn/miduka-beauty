// app/(store)/account/addresses/page.tsx
// Customer saved addresses management page

"use client";

import { useEffect, useState } from "react";
import { Plus, MapPin, MoreVertical, Pencil, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddressForm from "@/components/store/address-form";
import { toast } from "sonner";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/account/addresses");
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCreateOrUpdate = async (values: any) => {
    try {
      const url = editingAddress 
        ? `/api/account/addresses/${editingAddress.id}` 
        : "/api/account/addresses";
      const method = editingAddress ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast.success(editingAddress ? "Address updated" : "Address created");
        setIsDialogOpen(false);
        setEditingAddress(null);
        fetchAddresses();
      } else {
        throw new Error("Failed to save address");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Address deleted");
        fetchAddresses();
      } else {
        throw new Error("Failed to delete address");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/account/addresses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDefault: true }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast.success("Default address updated");
        fetchAddresses();
      } else {
        throw new Error("Failed to set default");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  if (loading && addresses.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">My Addresses</h1>
          <p className="text-muted-foreground">
            Manage your delivery addresses for faster checkout.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingAddress(null);
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl gap-2 shadow-md">
              <Plus className="w-4 h-4" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-3xl">
            <DialogHeader>
              <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
              <DialogDescription>
                Fill in the details below to save your delivery address.
              </DialogDescription>
            </DialogHeader>
            <AddressForm 
              initialData={editingAddress} 
              onSubmit={handleCreateOrUpdate} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">No addresses saved</h3>
            <p className="text-muted-foreground">
              Add a delivery address to speed up your checkout process.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`group relative p-6 border rounded-3xl transition-all duration-200 bg-card hover:shadow-md ${
                address.isDefault ? "border-primary/50 ring-1 ring-primary/20" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    address.isDefault ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{address.fullName}</span>
                      {address.isDefault && (
                        <Badge variant="outline-green" className="rounded-full px-2 py-0 text-[10px]">
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>{address.city}, {address.county} {address.postalCode}</p>
                      <p className="pt-2 font-medium text-foreground">{address.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!address.isDefault && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hidden sm:flex rounded-xl text-xs"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl">
                      <DropdownMenuItem 
                        onClick={() => {
                          setEditingAddress(address);
                          setIsDialogOpen(true);
                        }}
                        className="gap-2 rounded-xl"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      {!address.isDefault && (
                        <DropdownMenuItem 
                          onClick={() => handleSetDefault(address.id)}
                          className="sm:hidden gap-2 rounded-xl"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDelete(address.id)}
                        className="gap-2 rounded-xl text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
