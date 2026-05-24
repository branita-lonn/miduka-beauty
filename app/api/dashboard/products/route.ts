// app/api/dashboard/products/route.ts
// API route for fetching and creating products

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/generate-slug";
import { computeCompleteness } from "@/lib/product-completeness";
import { ProductWithRelations, productWithRelations, VariantInput, ProductImageInput } from "@/types";
import { generateBlurDataUrl } from "@/lib/cloudinary-blur";
import { serializeProduct } from "@/lib/serialize-product";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: productWithRelations.include,
      orderBy: { createdAt: "desc" },
    });

    const serialized = products.map((product) => {
      const pWithScore = {
        ...product,
        completenessScore: computeCompleteness(product as any),
      };
      return serializeProduct(pWithScore as any);
    });

    return NextResponse.json(serialized);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[PRODUCTS_GET] ${error.message}`);
    } else {
      console.error(`[PRODUCTS_GET] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("POST /api/dashboard/products - HIT");
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if ("colour" in body || "size" in body || "material" in body) {
      return NextResponse.json(
        { error: "colour, size, and material are no longer accepted. Use the attributes array on each variant instead." },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      price,
      compareAtPrice,
      categoryId,
      tags,
      isActive,
      isFeatured,
      isOnSale,
      stockQuantity,
      images = [],
      variants = [],
      productAttributes = [],
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const slug = await generateUniqueSlug(name, async (currentSlug) => {
      const existing = await prisma.product.findUnique({
        where: { slug: currentSlug },
      });
      return !!existing;
    });

    console.log("CREATING PRODUCT IN DB - Payload:", { name, price, categoryId, imagesCount: images?.length });
    const serializedProduct = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          slug,
          description,
          price,
          compareAtPrice,
          categoryId: categoryId || null,
          tags: tags || [],
          isActive: isActive !== undefined ? isActive : true,
          isFeatured: isFeatured || false,
          isOnSale: isOnSale || false,
          stockQuantity: stockQuantity || 0,
        },
      });

      // Create variants
      const createdVariants = await Promise.all(
        variants.map((v: VariantInput) =>
          tx.productVariant.create({
            data: {
              productId: newProduct.id,
              priceOverride: v.priceOverride,
              stockQuantity: v.stockQuantity || 0,
              sku: v.sku || null,
              isActive: v.isActive !== undefined ? v.isActive : true,
              attributes: {
                create: v.attributes.map((a) => ({
                  attributeDefinitionId: a.attributeDefinitionId,
                  value: a.value,
                })),
              },
            },
          })
        )
      );

      // Create product-level attributes
      if (productAttributes.length > 0) {
        await tx.productAttribute.createMany({
          data: productAttributes.map((pa: any) => ({
            productId: newProduct.id,
            attributeDefinitionId: pa.attributeDefinitionId,
            value: pa.value,
          })),
        });
      }

      // Create images
      const createdImages = await Promise.all(
        images.map(async (img: ProductImageInput, idx: number) => {
          const url = typeof img === "string" ? img : img.url;
          const blurDataUrl = (typeof img === "object" && img.blurDataUrl)
            ? img.blurDataUrl
            : await generateBlurDataUrl(url);

          return tx.productImage.create({
            data: {
              productId: newProduct.id,
              url,
              altText: (typeof img === "object" && img.altText) ? img.altText : null,
              blurDataUrl,
              sortOrder: (typeof img === "object" && img.sortOrder !== undefined) ? img.sortOrder : idx,
            },
          });
        })
      );

      // Link images to variants using variantIndex
      for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
        const imgInput = images[imgIdx];
        const createdImage = createdImages[imgIdx];
        if (typeof imgInput === "object" && imgInput.variantIndex !== undefined && imgInput.variantIndex !== null) {
          const linkedVariant = createdVariants[imgInput.variantIndex];
          if (linkedVariant) {
            await tx.productImageVariant.create({
              data: {
                imageId: createdImage.id,
                variantId: linkedVariant.id,
              },
            });
          }
        }
      }

      // Fetch the full product with all relation arrays resolved
      const fullProduct = await tx.product.findUnique({
        where: { id: newProduct.id },
        include: productWithRelations.include,
      });

      if (!fullProduct) {
        throw new Error("Product creation failed to retrieve record.");
      }

      const score = computeCompleteness(fullProduct as any);
      return serializeProduct({ ...fullProduct, completenessScore: score } as any);
    });

    console.log("PRODUCT CREATED SUCCESSFULLY:", serializedProduct.id);
    return NextResponse.json(serializedProduct);
  } catch (error: any) {
    console.error(`[PRODUCTS_POST]`, error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
