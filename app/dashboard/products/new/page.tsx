// app/dashboard/products/new/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AddProductForm } from "@/components/dashboard/add-product-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Add Product | MiDuka",
  description: "Add a new product to your catalogue",
};

export default async function NewProductPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/auth/login");
  }

  const [categories, featuredCount, definitions] = await Promise.all([
    prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    }),
    prisma.product.count({
      where: { isFeatured: true }
    }),
    prisma.attributeDefinition.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      include: { allowedValues: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  const availableAttributes = definitions.map((def) => ({
    id: def.id,
    key: def.key,
    label: def.label,
    unit: def.unit,
    inputType: def.inputType as "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN" | "COLOR",
    sortOrder: def.sortOrder,
    isFilterable: def.isFilterable,
    categoryId: def.categoryId,
    allowedValues: def.allowedValues.map((v) => v.value),
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add Product</h2>
          <p className="text-muted-foreground">Create a new product for your store.</p>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <AddProductForm 
          categories={categories} 
          featuredCount={featuredCount} 
          availableAttributes={availableAttributes}
        />
      </div>
    </div>
  );
}
