// app/dashboard/attributes/page.tsx
// purpose: Seller-facing attribute management — list, create, edit, delete
//          AttributeDefinition records that drive the variant builder.

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AttributesClient } from "@/components/dashboard/attributes-client";
import { AttributeDefinitionPublic } from "@/types";

export const metadata: Metadata = {
  title: "Attributes | MiDuka",
  description: "Define the properties that make your product variants distinct",
};

export default async function AttributesPage() {
  const session = await auth();

  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/auth/login");
  }

  // Fetch all attribute definitions ordered by sortOrder then label
  const [definitions, categories] = await Promise.all([
    prisma.attributeDefinition.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      include: { 
        allowedValues: { orderBy: { sortOrder: "asc" } },
        categories: true,
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const initialAttributes: AttributeDefinitionPublic[] = definitions.map((def) => ({
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <AttributesClient
        initialAttributes={initialAttributes}
        categories={categories}
      />
    </div>
  );
}
