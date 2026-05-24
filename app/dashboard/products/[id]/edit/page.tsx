// app/dashboard/products/[id]/edit/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EditProductForm } from "@/components/dashboard/edit-product-form";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { serializeProduct } from "@/lib/serialize-product";

export const metadata: Metadata = {
  title: "Edit Product | MiDuka",
  description: "Edit an existing product",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/auth/login");
  }

  const [product, categories, featuredCount, definitions] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          include: {
            variantLinks: {
              include: { variant: true },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        variants: {
          include: {
            attributes: {
              include: { attributeDefinition: true },
              orderBy: { attributeDefinition: { sortOrder: "asc" } },
            },
            imageLinks: {
              include: { image: true },
            },
          },
        },
        productAttributes: {
          include: { attributeDefinition: true },
        },
        flashSale: true,
      },
    }),
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
      include: { allowedValues: { orderBy: { sortOrder: "asc" } }, categories: true },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const availableAttributes = definitions.map((def) => ({
    id: def.id,
    key: def.key,
    label: def.label,
    unit: def.unit,
    inputType: def.inputType as "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN" | "COLOR",
    sortOrder: def.sortOrder,
    isFilterable: def.isFilterable,
    isGlobal: def.isGlobal,
    isVariantAttr: def.isVariantAttr,
    categoryIds: def.categories.map((c: any) => c.categoryId),
    allowedValues: def.allowedValues.map((v: any) => v.value),
  }));

  const serializedProduct = serializeProduct(product);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
          <p className="text-muted-foreground">Update the details for this product.</p>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <EditProductForm 
          initialData={serializedProduct} 
          categories={categories} 
          featuredCount={featuredCount}
          availableAttributes={availableAttributes}
        />
      </div>
    </div>
  );
}
