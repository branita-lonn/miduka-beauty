// file: app/api/dashboard/attributes/[id]/route.ts
// purpose: Read, update, and delete a single AttributeDefinition. STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, AttributeInputType } from "@prisma/client";
import * as z from "zod";

const updateSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  unit: z.string().max(20).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isFilterable: z.boolean().optional(),
  allowedValues: z.array(z.string().min(1)).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const def = await prisma.attributeDefinition.findUnique({
      where: { id },
      include: { allowedValues: { orderBy: { sortOrder: "asc" } } },
    });

    if (!def) {
      return NextResponse.json({ error: "Attribute definition not found" }, { status: 404 });
    }

    const serialized = {
      id: def.id,
      key: def.key,
      label: def.label,
      unit: def.unit,
      inputType: def.inputType,
      sortOrder: def.sortOrder,
      isFilterable: def.isFilterable,
      categoryId: def.categoryId,
      allowedValues: def.allowedValues.map((v) => v.value),
    };

    return NextResponse.json(serialized);
  } catch (error: unknown) {
    console.error("[ATTRIBUTE_API_ERROR] [GET /api/dashboard/attributes/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch attribute definition" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if ("key" in body || "inputType" in body || "categoryId" in body) {
      return NextResponse.json(
        { error: "key, inputType, and categoryId cannot be changed after creation. Delete and recreate the attribute instead." },
        { status: 400 }
      );
    }

    const validatedData = updateSchema.parse(body);

    const existingDef = await prisma.attributeDefinition.findUnique({
      where: { id },
    });

    if (!existingDef) {
      return NextResponse.json({ error: "Attribute definition not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const def = await tx.attributeDefinition.update({
        where: { id },
        data: {
          label: validatedData.label,
          unit: validatedData.unit !== undefined ? validatedData.unit : undefined,
          sortOrder: validatedData.sortOrder,
          isFilterable: validatedData.isFilterable,
        },
      });

      if (validatedData.allowedValues) {
        // SELECT attribute type validation check
        if (existingDef.inputType === AttributeInputType.SELECT && validatedData.allowedValues.length === 0) {
          throw new Error("allowedValues must be a non-empty array for SELECT attributes.");
        }

        // Recreate allowedValues
        await tx.attributeAllowedValue.deleteMany({
          where: { attributeDefinitionId: id },
        });

        await Promise.all(
          validatedData.allowedValues.map((val, idx) =>
            tx.attributeAllowedValue.create({
              data: {
                attributeDefinitionId: id,
                value: val,
                sortOrder: idx,
              },
            })
          )
        );
      }

      return def;
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("allowedValues")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[ATTRIBUTE_API_ERROR] [PUT /api/dashboard/attributes/[id]]", error);
    return NextResponse.json({ error: "Failed to update attribute definition" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const usageCount = await prisma.productVariantAttribute.count({
      where: { attributeDefinitionId: id },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { error: `This attribute is used by ${usageCount} variant(s). Remove it from all variants before deleting.` },
        { status: 400 }
      );
    }

    await prisma.attributeDefinition.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error("[ATTRIBUTE_API_ERROR] [DELETE /api/dashboard/attributes/[id]]", error);
    return NextResponse.json({ error: "Failed to delete attribute definition" }, { status: 500 });
  }
}
