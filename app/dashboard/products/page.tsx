// app/dashboard/products/page.tsx
// Products dashboard page

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductsClient } from "@/components/dashboard/products-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { computeCompleteness } from "@/lib/product-completeness";
import { ProductWithRelations } from "@/types";
import { serializeProduct } from "@/lib/serialize-product";

export const metadata: Metadata = {
  title: "Products | MiDuka",
  description: "Manage product catalogue",
};

export default async function ProductsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/auth/login");
  }

  const products = await prisma.product.findMany({
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
    orderBy: { createdAt: "desc" },
  });

  const productsWithScore = products.map((product) => {
    const serialized = serializeProduct(product);
    return {
      ...serialized,
      completenessScore: computeCompleteness(product as any),
    };
  });

  const featuredCount = products.filter(p => p.isFeatured).length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ProductsClient 
        initialProducts={productsWithScore} 
      />
    </div>
  );
}
