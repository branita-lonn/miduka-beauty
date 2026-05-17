// components/dashboard/attributes-client.tsx
// purpose: Client component listing product variant attributes and housing create/edit sheets.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  SlidersHorizontal,
  Check,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InlineConfirmDelete } from "@/components/dashboard/inline-confirm-delete";
import { AttributeForm } from "@/components/dashboard/attribute-form";
import { AttributeDefinitionPublic } from "@/types";
import { Category } from "@prisma/client";

interface AttributesClientProps {
  initialAttributes: AttributeDefinitionPublic[];
  categories: Category[];
}

export function AttributesClient({ initialAttributes, categories }: AttributesClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeDefinitionPublic | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEditClick = (attribute: AttributeDefinitionPublic) => {
    setEditingAttribute(attribute);
    setIsOpen(true);
  };

  const handleCreateClick = () => {
    setEditingAttribute(null);
    setIsOpen(true);
  };

  const handleSuccess = () => {
    setIsOpen(false);
    setEditingAttribute(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dashboard/attributes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete attribute definition.");
      }

      toast.success("Attribute definition deleted.");
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete.";
      toast.error(msg, { duration: 6000 });
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Attributes</h2>
            <Badge variant="outline" className="rounded-full px-3 py-1 font-mono text-xs text-primary flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" />
              Dynamic Schema Engine
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Define attributes (e.g. RAM, size, material) to dynamically generate and control your store's variants.
          </p>
        </div>
        <Button onClick={handleCreateClick} className="rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Attribute
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Display Label</TableHead>
              <TableHead>Input Type</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Storefront Filter</TableHead>
              <TableHead>Allowed Values</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialAttributes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No attributes defined yet. Create one to begin structuring your variant catalogue!
                </TableCell>
              </TableRow>
            ) : (
              initialAttributes.map((attr) => {
                const category = categories.find((c) => c.id === attr.categoryId);

                return (
                  <TableRow key={attr.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-semibold">{attr.key}</TableCell>
                    <TableCell className="font-medium">{attr.label}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-lg capitalize font-normal px-2.5 py-0.5">
                        {attr.inputType.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{attr.unit || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center pl-4">
                        {attr.isFilterable ? (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {attr.inputType === "SELECT" ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="rounded-full cursor-help hover:border-primary/50 transition-colors">
                                {attr.allowedValues.length} values
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[250px] p-2 flex flex-wrap gap-1">
                              {attr.allowedValues.map((v, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] rounded px-1.5 py-0.5">
                                  {v}
                                </Badge>
                              ))}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">Dynamic</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {category ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Layers className="h-3 w-3 flex-shrink-0" />
                          <span>{category.name} Only</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-primary font-medium">
                          <Sparkles className="h-3 w-3 flex-shrink-0" />
                          <span>Global</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEditClick(attr)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <InlineConfirmDelete
                          onDelete={() => handleDelete(attr.id)}
                          loading={deletingId === attr.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sheet component for Create/Edit */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingAttribute ? "Edit Attribute" : "Add Attribute"}</SheetTitle>
            <SheetDescription>
              {editingAttribute
                ? "Update display labels, units, and custom parameters for this attribute."
                : "Create a type-aware attribute definitions to structure variant options dynamically."}
            </SheetDescription>
          </SheetHeader>
          <AttributeForm
            initialData={editingAttribute}
            categories={categories}
            onSuccess={handleSuccess}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
