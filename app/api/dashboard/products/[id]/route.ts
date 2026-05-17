// app/api/dashboard/products/[id]/route.ts
// API route for fetching, updating, and deleting a single product

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/generate-slug";
import { generateBlurDataUrl } from "@/lib/cloudinary-blur";
import { computeCompleteness } from "@/lib/product-completeness";
import { productWithRelations, ProductImageInput } from "@/types";
import { serializeProduct } from "@/lib/serialize-product";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: productWithRelations.include,
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const score = computeCompleteness(product as any);
    return NextResponse.json(serializeProduct({ ...product, completenessScore: score } as any));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[PRODUCT_GET] ${error.message}`);
    } else {
      console.error(`[PRODUCT_GET] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
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
      images,
      variants,
    } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let updatedSlug = existingProduct.slug;

    if (name && name !== existingProduct.name) {
      updatedSlug = await generateUniqueSlug(name, async (currentSlug) => {
        const existing = await prisma.product.findUnique({
          where: { slug: currentSlug },
        });
        return !!existing && existing.id !== productId;
      });
    }

    const serialized = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          slug: updatedSlug,
          description,
          price,
          compareAtPrice,
          categoryId: categoryId || null,
          tags: tags || [],
          isActive: isActive !== undefined ? isActive : existingProduct.isActive,
          isFeatured: isFeatured !== undefined ? isFeatured : existingProduct.isFeatured,
          isOnSale: isOnSale !== undefined ? isOnSale : existingProduct.isOnSale,
          stockQuantity: stockQuantity !== undefined ? stockQuantity : existingProduct.stockQuantity,
        },
      });

      const allVariants: any[] = [];
      if (variants) {
        const existingVariants = await tx.productVariant.findMany({
          where: { productId },
        });

        const incomingVariantIds = variants.map((v: { id?: string }) => v.id).filter(Boolean);

        const variantsToDelete = existingVariants
          .filter((ev) => !incomingVariantIds.includes(ev.id))
          .map((ev) => ev.id);

        if (variantsToDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: variantsToDelete } },
          });
        }

        for (const variant of variants) {
          if (variant.id) {
            const updatedVar = await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                priceOverride: variant.priceOverride,
                stockQuantity: variant.stockQuantity || 0,
                sku: variant.sku || null,
                isActive: variant.isActive !== undefined ? variant.isActive : true,
              },
            });
            
            await tx.productVariantAttribute.deleteMany({
              where: { variantId: variant.id },
            });

            await Promise.all(
              variant.attributes.map((a: any) =>
                tx.productVariantAttribute.create({
                  data: {
                    variantId: variant.id,
                    attributeDefinitionId: a.attributeDefinitionId,
                    value: a.value,
                  },
                })
              )
            );
            allVariants.push(updatedVar);
          } else {
            const newVar = await tx.productVariant.create({
              data: {
                productId,
                priceOverride: variant.priceOverride,
                stockQuantity: variant.stockQuantity || 0,
                sku: variant.sku || null,
                isActive: variant.isActive !== undefined ? variant.isActive : true,
                attributes: {
                  create: variant.attributes.map((a: any) => ({
                    attributeDefinitionId: a.attributeDefinitionId,
                    value: a.value,
                  })),
                },
              },
            });
            allVariants.push(newVar);
          }
        }
      }

      if (images) {
        await tx.productImage.deleteMany({
          where: { productId },
        });

        if (images.length > 0) {
          const createdImages = await Promise.all(
            images.map(async (img: ProductImageInput, idx: number) => {
              const url = typeof img === "string" ? img : img.url;
              const blurDataUrl = (typeof img === "object" && img.blurDataUrl)
                ? img.blurDataUrl
                : await generateBlurDataUrl(url);

              return tx.productImage.create({
                data: {
                  productId,
                  url,
                  blurDataUrl,
                  altText: (typeof img === "object" && img.altText) ? img.altText : null,
                  sortOrder: (typeof img === "object" && img.sortOrder !== undefined) ? img.sortOrder : idx,
                },
              });
            })
          );

          // Create new image-variant links
          for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
            const imgInput = images[imgIdx];
            const createdImage = createdImages[imgIdx];

            if (typeof imgInput === "object") {
              // 1. Link by variantIds
              if (imgInput.variantIds && imgInput.variantIds.length > 0) {
                for (const varId of imgInput.variantIds) {
                  const variantExists = allVariants.some((v) => v.id === varId);
                  if (variantExists) {
                    await tx.productImageVariant.create({
                      data: {
                        imageId: createdImage.id,
                        variantId: varId,
                      },
                    });
                  }
                }
              }

              // 2. Link by variantIndex
              if (imgInput.variantIndex !== undefined && imgInput.variantIndex !== null) {
                const linkedVariant = allVariants[imgInput.variantIndex];
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
          }
        }
      }

      // Fetch full product after updates resolve
      const fullProduct = await tx.product.findUnique({
        where: { id: productId },
        include: productWithRelations.include,
      });

      if (!fullProduct) {
        throw new Error("Product retrieval failed after update.");
      }

      const score = computeCompleteness(fullProduct as any);
      return serializeProduct({ ...fullProduct, completenessScore: score } as any);
    });

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error(`[PRODUCT_PUT]`, error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch images before deletion so we can clean up Cloudinary afterwards
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: { select: { url: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check for linked order items before attempting delete
    const orderItemCount = await prisma.orderItem.count({
      where: { productId },
    });

    if (orderItemCount > 0) {
      return NextResponse.json(
        {
          error: `This product cannot be deleted because it is linked to ${orderItemCount} order${orderItemCount === 1 ? "" : "s"}. To keep your order history intact, consider deactivating it instead.`,
          code: "PRODUCT_HAS_ORDERS",
        },
        { status: 409 }
      );
    }

    // Delete product — ProductImage and ProductVariant records are cascade-deleted
    await prisma.product.delete({ where: { id: productId } });

    // Clean up Cloudinary images after DB delete (best-effort)
    // Extract publicId from Cloudinary URL: .../upload/v<version>/<publicId>.<ext>
    const { deleteImage } = await import("@/lib/cloudinary");
    for (const image of product.images) {
      const match = image.url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
      if (match?.[1]) await deleteImage(match[1]);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[PRODUCT_DELETE] ${error.message}`);
    } else {
      console.error(`[PRODUCT_DELETE] Unknown error`);
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

