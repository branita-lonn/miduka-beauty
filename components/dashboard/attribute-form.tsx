// components/dashboard/attribute-form.tsx
// purpose: Form to create or edit an AttributeDefinition within a sheet.

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { AttributeDefinitionPublic } from "@/types";
import { Category } from "@prisma/client";

const attributeSchema = z.object({
  key: z
    .string()
    .regex(/^[a-z][a-z0-9_]*$/, "Key must start with a lowercase letter and contain only lowercase letters, numbers, and underscores")
    .max(50),
  label: z.string().min(1, "Label is required").max(100),
  unit: z.string().max(20).optional().nullable(),
  inputType: z.enum(["TEXT", "NUMBER", "SELECT", "BOOLEAN", "COLOR"]),
  sortOrder: z.coerce.number().int().default(0),
  isFilterable: z.boolean().default(false),
  categoryId: z.string().optional().nullable(),
  allowedValues: z.array(z.string().min(1)).default([]),
});

type AttributeFormValues = z.infer<typeof attributeSchema>;

interface AttributeFormProps {
  initialData?: AttributeDefinitionPublic | null;
  categories: Category[];
  onSuccess: () => void;
}

export function AttributeForm({ initialData, categories, onSuccess }: AttributeFormProps) {
  const [loading, setLoading] = useState(false);
  const [newValueInput, setNewValueInput] = useState("");

  const isEdit = !!initialData;

  const form = useForm({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      key: initialData?.key || "",
      label: initialData?.label || "",
      unit: initialData?.unit || "",
      inputType: initialData?.inputType || "TEXT",
      sortOrder: initialData?.sortOrder ?? 0,
      isFilterable: initialData?.isFilterable ?? false,
      categoryId: initialData?.categoryId || null,
      allowedValues: initialData?.allowedValues || [],
    },
  });

  const selectedInputType = form.watch("inputType");
  const allowedValues = form.watch("allowedValues") || [];

  // When key field changes, force it to lowercase and remove invalid characters
  const handleKeyChange = (val: string) => {
    const formatted = val
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    form.setValue("key", formatted, { shouldValidate: true });
  };

  const handleAddValue = () => {
    const trimmed = newValueInput.trim();
    if (!trimmed) return;
    if (allowedValues.includes(trimmed)) {
      toast.error("This value already exists.");
      return;
    }
    form.setValue("allowedValues", [...allowedValues, trimmed], { shouldValidate: true });
    setNewValueInput("");
  };

  const handleRemoveValue = (indexToRemove: number) => {
    form.setValue(
      "allowedValues",
      allowedValues.filter((_, idx) => idx !== indexToRemove),
      { shouldValidate: true }
    );
  };

  const onSubmit = async (data: any) => {
    if (data.inputType === "SELECT" && (!data.allowedValues || data.allowedValues.length === 0)) {
      form.setError("allowedValues", { message: "SELECT attributes require at least one allowed value." });
      return;
    }

    setLoading(true);
    try {
      const url = isEdit && initialData
        ? `/api/dashboard/attributes/${initialData.id}`
        : "/api/dashboard/attributes";
      const method = isEdit ? "PUT" : "POST";

      const payload = isEdit
        ? {
            label: data.label,
            unit: data.unit || null,
            sortOrder: data.sortOrder,
            isFilterable: data.isFilterable,
            allowedValues: data.inputType === "SELECT" ? data.allowedValues : undefined,
          }
        : {
            ...data,
            unit: data.unit || null,
            categoryId: data.categoryId || null,
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.error || `Failed to ${isEdit ? "update" : "create"} attribute`);
      }

      toast.success(`Attribute ${isEdit ? "updated" : "created"} successfully.`);
      onSuccess();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(msg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
        {/* Key Field (Locked on Edit) */}
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key (Internal Name)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="e.g. ram, battery_capacity"
                  disabled={isEdit}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  className="rounded-xl border-border/50 bg-background/50 h-10"
                />
              </FormControl>
              <FormDescription>
                Unique identifier. Lowercase letters, numbers, and underscores only. Locked after creation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Label Field */}
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Label</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="e.g. RAM, Battery Capacity"
                  className="rounded-xl border-border/50 bg-background/50 h-10"
                />
              </FormControl>
              <FormDescription>Human-readable name displayed to sellers and customers.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Input Type Field (Locked on Edit) */}
          <FormField
            control={form.control}
            name="inputType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Input Type</FormLabel>
                <FormControl>
                  <UiSelect
                    disabled={isEdit}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="rounded-xl border-border/50 bg-background/50 h-10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="NUMBER">Number</SelectItem>
                      <SelectItem value="SELECT">Dropdown (Select)</SelectItem>
                      <SelectItem value="BOOLEAN">Yes / No (Boolean)</SelectItem>
                      <SelectItem value="COLOR">Color Swatch</SelectItem>
                    </SelectContent>
                  </UiSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unit Field */}
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={(field.value as string) || ""}
                    placeholder="e.g. GB, mAh, cm"
                    disabled={selectedInputType !== "NUMBER"}
                    className="rounded-xl border-border/50 bg-background/50 h-10"
                  />
                </FormControl>
                <FormDescription>Used for NUMBER type.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category Scope Selection (Locked on Edit) */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Scope</FormLabel>
              <FormControl>
                <UiSelect
                  disabled={isEdit}
                  value={field.value || "store-wide"}
                  onValueChange={(val) => field.onChange(val === "store-wide" ? null : val)}
                >
                  <SelectTrigger className="rounded-xl border-border/50 bg-background/50 h-10">
                    <SelectValue placeholder="Store-wide" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store-wide">Store-wide (All categories)</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </UiSelect>
              </FormControl>
              <FormDescription>
                Make this attribute available only under a specific category. Locked after creation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Allowed Values Chip List (For SELECT type only) */}
        {selectedInputType === "SELECT" && (
          <div className="space-y-3 rounded-2xl border p-4 bg-muted/20">
            <FormLabel className="text-sm font-semibold">Allowed Dropdown Values</FormLabel>
            <div className="flex gap-2">
              <Input
                placeholder="Type a value and click Add"
                value={newValueInput}
                onChange={(e) => setNewValueInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddValue();
                  }
                }}
                className="rounded-xl border-border/50 bg-background/50 h-9 flex-1"
              />
              <Button type="button" size="sm" onClick={handleAddValue} className="rounded-xl h-9">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            {allowedValues.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {allowedValues.map((val, idx) => (
                  <Badge key={`${val}-${idx}`} variant="secondary" className="rounded-lg pl-2 pr-1 py-1 flex items-center gap-1 text-xs">
                    {val}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(idx)}
                      className="text-muted-foreground hover:text-foreground rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pt-1">At least one value is required.</p>
            )}
            
            {form.formState.errors.allowedValues && (
              <p className="text-xs text-destructive">{form.formState.errors.allowedValues.message}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* sortOrder */}
          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={(field.value as number) ?? 0}
                    className="rounded-xl border-border/50 bg-background/50 h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* isFilterable Switch */}
          <FormField
            control={form.control}
            name="isFilterable"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end pb-2">
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Use as Storefront Filter</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading} className="rounded-full px-6 h-10">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isEdit ? "Update Attribute" : "Create Attribute"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
