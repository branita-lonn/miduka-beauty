// file: app/api/dashboard/attributes/route.ts
// purpose: List and create AttributeDefinition records. STORE_OWNER only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, AttributeInputType } from "@prisma/client";
import * as z from "zod";

const createSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/, "key must be lowercase alphanumeric + underscores").max(50),
  label: z.string().min(1).max(100),
  unit: z.string().max(20).optional().nullable(),
  inputType: z.nativeEnum(AttributeInputType),
  sortOrder: z.number().int().optional().default(0),
  isFilterable: z.boolean().optional().default(false),
  isGlobal: z.boolean().optional().default(true),
  isVariantAttr: z.boolean().optional().default(true),
  categoryIds: z.array(z.string().cuid()).optional().default([]),
  includeChildren: z.boolean().optional().default(false),
  allowedValues: z.array(z.string().min(1)).optional(),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isFilterableParam = searchParams.get("isFilterable");
    const categoryIdParam = searchParams.get("categoryId");
    
    const where: any = isFilterableParam === "true" ? { isFilterable: true } : {};

    const definitions = await prisma.attributeDefinition.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      include: { 
        allowedValues: { orderBy: { sortOrder: "asc" } },
        categories: true,
      },
    });

    let filteredDefinitions = definitions;

    if (categoryIdParam) {
      // Find ancestors
      const ancestorIds: string[] = [];
      let currentId: string = categoryIdParam;
      while (currentId) {
        const cat = await prisma.category.findUnique({ 
          where: { id: currentId }, 
          select: { parentId: true } 
        });
        if (cat?.parentId) {
          ancestorIds.push(cat.parentId);
          currentId = cat.parentId;
        } else {
          break;
        }
      }

      filteredDefinitions = definitions.filter(def => {
        if (def.isGlobal) return true;
        // Direct assignment
        const directAssign = def.categories.find(c => c.categoryId === categoryIdParam);
        if (directAssign) return true;
        // Ancestor assignment with includeChildren = true
        const ancestorAssign = def.categories.find(c => ancestorIds.includes(c.categoryId) && c.includeChildren);
        if (ancestorAssign) return true;

        return false;
      });
    }

    const serialized = filteredDefinitions.map((def) => ({
      id: def.id,
      key: def.key,
      label: def.label,
      unit: def.unit,
      inputType: def.inputType,
      sortOrder: def.sortOrder,
      isFilterable: def.isFilterable,
      isGlobal: def.isGlobal,
      isVariantAttr: def.isVariantAttr,
      categoryIds: def.categories.map((c) => c.categoryId),
      allowedValues: def.allowedValues.map((v) => v.value),
    }));

    return NextResponse.json(serialized);
  } catch (error: unknown) {
    console.error("[ATTRIBUTE_API_ERROR] [GET /api/dashboard/attributes]", error);
    return NextResponse.json({ error: "Failed to fetch attribute definitions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || session.user?.role !== UserRole.STORE_OWNER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createSchema.parse(body);

    if (validatedData.inputType === AttributeInputType.SELECT) {
      if (!validatedData.allowedValues || validatedData.allowedValues.length === 0) {
        return NextResponse.json(
          { error: "allowedValues must be a non-empty array for SELECT attributes." },
          { status: 400 }
        );
      }
    }

    // Uniqueness check
    if (validatedData.isGlobal) {
      const existing = await prisma.attributeDefinition.findFirst({
        where: { key: validatedData.key, isGlobal: true },
      });
      if (existing) {
        return NextResponse.json({ error: "A global attribute with this key already exists." }, { status: 409 });
      }
    } else {
      if (validatedData.categoryIds.length > 0) {
        const existing = await prisma.attributeDefinition.findFirst({
          where: { 
            key: validatedData.key, 
            isGlobal: false,
            categories: {
              some: { categoryId: { in: validatedData.categoryIds } }
            }
          },
        });
        if (existing) {
          return NextResponse.json({ error: "An attribute with this key already exists in one of the selected categories." }, { status: 409 });
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const def = await tx.attributeDefinition.create({
        data: {
          key: validatedData.key,
          label: validatedData.label,
          unit: validatedData.unit || null,
          inputType: validatedData.inputType,
          sortOrder: validatedData.sortOrder,
          isFilterable: validatedData.isFilterable,
          isGlobal: validatedData.isGlobal,
          isVariantAttr: validatedData.isVariantAttr,
          categories: validatedData.isGlobal ? undefined : {
            create: validatedData.categoryIds.map(cid => ({
              categoryId: cid,
              includeChildren: validatedData.includeChildren
            }))
          }
        },
      });

      if (validatedData.inputType === AttributeInputType.SELECT && validatedData.allowedValues) {
        await Promise.all(
          validatedData.allowedValues.map((val, idx) =>
            tx.attributeAllowedValue.create({
              data: {
                attributeDefinitionId: def.id,
                value: val,
                sortOrder: idx,
              },
            })
          )
        );
      }

      return def;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("[ATTRIBUTE_API_ERROR] [POST /api/dashboard/attributes]", error);
    return NextResponse.json({ error: "Failed to create attribute definition" }, { status: 500 });
  }
}
